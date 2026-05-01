/**
 * Solo para entorno servidor (Route Handlers). No importar desde componentes cliente.
 */
import { JWT } from "google-auth-library";
import type { GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { GoogleSpreadsheet } from "google-spreadsheet";
import type { TipoVisitaAgendada } from "@/lib/agendaVisita";
import {
  RESISTENCIAS_KG,
  mergePreciosRowsPreferColumnasAb,
  parseResistenciaKg,
} from "@/lib/cotizacion";
import type {
  AditivoCotizacion,
  CotizacionPreciosConfig,
  PrecioConcretoPorServicio,
  ResistenciaRapidaDias,
  ZonaCotizacion,
  ZonaPreciosConcreto,
} from "@/types/sheets";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

let docSingleton: GoogleSpreadsheet | null = null;

function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  if (!raw) throw new Error("GOOGLE_PRIVATE_KEY no está definida");
  return raw.replace(/\\n/g, "\n");
}

/** JWT de la cuenta de servicio (Sheets + Calendar). Solo servidor. */
export function getGoogleServiceAccountJwt(): JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!email) throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL no está definida");
  return new JWT({
    email,
    key: getPrivateKey(),
    scopes: [...SCOPES],
  });
}

export async function getSpreadsheetDoc(): Promise<GoogleSpreadsheet> {
  if (docSingleton) return docSingleton;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID no está definida");

  const auth = getGoogleServiceAccountJwt();

  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();
  docSingleton = doc;
  return doc;
}

export interface PrecioRow {
  Resistencia: string;
  Precio_m3: number;
  Cargo_distancia: number;
  Tipo_Vaciado: string;
}

function normHeader(k: string): string {
  return k
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** google-spreadsheet exige encabezados idénticos a row.get("Resistencia"); esto admite variantes. */
function extractResistenciaFlexible(row: GoogleSpreadsheetRow): string {
  const obj = row.toObject() as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    const kn = normHeader(k);
    if (kn.includes("resistencia")) {
      const s = String(v ?? "").trim();
      if (s !== "") return s;
    }
  }
  for (const v of Object.values(obj)) {
    const s = String(v ?? "").trim();
    if (parseResistenciaKg(s)) return s;
  }
  return String(row.get("Resistencia" as never) ?? "").trim();
}

function extractPrecioM3Flexible(row: GoogleSpreadsheetRow): number {
  const obj = row.toObject() as Record<string, unknown>;
  let best = 0;
  for (const [k, v] of Object.entries(obj)) {
    const kn = normHeader(k);
    if (
      /\bprecio\b/.test(kn) &&
      (kn.includes("m3") || kn.includes("m³") || /m[_\s]?3/.test(kn) || kn.includes("m 3"))
    ) {
      const p = parseFloat(String(v ?? "").replace(",", ".")) || 0;
      if (p > best) best = p;
    }
  }
  if (best > 0) return best;
  for (const [k, v] of Object.entries(obj)) {
    const kn = normHeader(k);
    if (
      kn === "precio" ||
      (kn.startsWith("precio") && !kn.includes("distancia") && !kn.includes("cargo") && !kn.includes("extra"))
    ) {
      const p = parseFloat(String(v ?? "").replace(",", ".")) || 0;
      if (p > 0) return p;
    }
  }
  return parseFloat(String(row.get("Precio_m3" as never) ?? "0").replace(",", ".")) || 0;
}

/** Precio en celda: número de Sheets, $, separadores de miles o coma decimal europea (p. ej. 1.234,56). */
function valorCeldaANum(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  let s = String(raw ?? "").trim();
  if (s === "") return 0;
  s = s.replace(/[$\s\u00a0]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const x = Number.parseFloat(s);
  return Number.isFinite(x) ? x : 0;
}

function valorCeldaATextoResistencia(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return String(raw ?? "").trim();
}

function normTexto(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0300/g, "")
    .replace(/[\s_\-]+/g, " ")
    .trim();
}

function celdaTexto(sheet: GoogleSpreadsheetWorksheet, row: number, col: number): string {
  return String(sheet.getCell(row, col)?.value ?? "").trim();
}

function celdaNumero(sheet: GoogleSpreadsheetWorksheet, row: number, col: number): number {
  return valorCeldaANum(sheet.getCell(row, col)?.value ?? "");
}

function servicioDesdeHeader(header: string): keyof PrecioConcretoPorServicio | null {
  const n = normTexto(header);
  if (n.includes("td") || n.includes("tiro")) return "tiro_directo";
  if (n.includes("pluma")) return "bombeo_pluma";
  if (n.includes("be") || n.includes("estacionaria")) return "bombeo_estacionaria";
  return null;
}

function zonaDesdeIndice(index: number): ZonaCotizacion | null {
  return (["Z1", "Z2", "Z3", "Z4"] as ZonaCotizacion[])[index] ?? null;
}

function zonaDesdeTexto(texto: string): ZonaCotizacion | null {
  const n = normTexto(texto);
  const m = n.match(/zona\s*([1-4])|\bz([1-4])\b/);
  const raw = m?.[1] ?? m?.[2];
  return raw ? (`Z${raw}` as ZonaCotizacion) : null;
}

function emptyZonaConfig(): ZonaPreciosConcreto {
  const preciosPorResistencia: Record<string, PrecioConcretoPorServicio> = {};
  for (const kg of RESISTENCIAS_KG) {
    preciosPorResistencia[String(kg)] = emptyPrecioConcretoPorServicio();
  }
  return {
    preciosPorResistencia,
    cargoVacioM3: 0,
    serviciosMinimosM3: { estacionaria: 0, pluma: 0 },
    servicioMinimoImporte: { estacionaria: 0, pluma: 0 },
  };
}

function emptyPrecioConcretoPorServicio(): PrecioConcretoPorServicio {
  return {
    tiro_directo: 0,
    bombeo_estacionaria: 0,
    bombeo_pluma: 0,
  };
}

function ensureResistenciaZona(zonaConfig: ZonaPreciosConcreto, resistencia: number): PrecioConcretoPorServicio {
  const key = String(resistencia);
  zonaConfig.preciosPorResistencia[key] ??= emptyPrecioConcretoPorServicio();
  return zonaConfig.preciosPorResistencia[key];
}

async function loadSheetGrid(sheet: GoogleSpreadsheetWorksheet): Promise<void> {
  const rows = Math.min(Math.max(sheet.rowCount || 120, 120), 300);
  const cols = Math.min(Math.max(sheet.columnCount || 12, 12), 40);
  const lastCol = columnToA1(cols - 1);
  await sheet.loadCells(`A1:${lastCol}${rows}`);
}

function columnToA1(colIndexZeroBased: number): string {
  let n = colIndexZeroBased + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function nearbyMoney(sheet: GoogleSpreadsheetWorksheet, row: number, col: number): number {
  const probes = [
    [row, col + 1],
    [row, col - 1],
    [row + 1, col],
    [row - 1, col],
    [row, col + 2],
    [row, col - 2],
  ];
  for (const [r, c] of probes) {
    if (r < 0 || c < 0) continue;
    const value = celdaNumero(sheet, r, c);
    if (value > 0) return value;
  }
  return 0;
}

function parseConcreteBlocks(sheet: GoogleSpreadsheetWorksheet): Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>> {
  const zonas: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>> = {};
  let blockIndex = 0;
  const maxRows = Math.min(Math.max(sheet.rowCount || 120, 120), 300);
  const maxCols = Math.min(Math.max(sheet.columnCount || 12, 12), 40);

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const header = normTexto(celdaTexto(sheet, r, c));
      if (!header.includes("f") || !header.includes("c")) continue;

      const serviceColumns: Partial<Record<keyof PrecioConcretoPorServicio, number>> = {};
      for (let hc = c + 1; hc < Math.min(c + 8, maxCols); hc++) {
        const servicio = servicioDesdeHeader(celdaTexto(sheet, r, hc));
        if (servicio) serviceColumns[servicio] = hc;
      }
      if (!serviceColumns.tiro_directo && !serviceColumns.bombeo_estacionaria && !serviceColumns.bombeo_pluma) {
        continue;
      }

      const zona = zonaDesdeTexto(celdaTexto(sheet, r - 1, c)) ?? zonaDesdeIndice(blockIndex);
      if (!zona) continue;
      blockIndex += 1;
      const zonaConfig = zonas[zona] ?? emptyZonaConfig();

      for (let rr = r + 1; rr < Math.min(r + 12, maxRows); rr++) {
        const resistencia = parseResistenciaKg(celdaTexto(sheet, rr, c));
        if (resistencia == null) {
          const cargo = celdaNumero(sheet, rr, c) || celdaNumero(sheet, rr, c + 1);
          if (cargo > 0 && zonaConfig.cargoVacioM3 <= 0) zonaConfig.cargoVacioM3 = cargo;
          if (normTexto(celdaTexto(sheet, rr, c)).includes("f") && normTexto(celdaTexto(sheet, rr, c)).includes("c")) break;
          continue;
        }
        const key = String(resistencia);
        const prev = ensureResistenciaZona(zonaConfig, resistencia);
        zonaConfig.preciosPorResistencia[key] = {
          tiro_directo: serviceColumns.tiro_directo != null ? celdaNumero(sheet, rr, serviceColumns.tiro_directo) : prev.tiro_directo,
          bombeo_estacionaria:
            serviceColumns.bombeo_estacionaria != null
              ? celdaNumero(sheet, rr, serviceColumns.bombeo_estacionaria)
              : prev.bombeo_estacionaria,
          bombeo_pluma: serviceColumns.bombeo_pluma != null ? celdaNumero(sheet, rr, serviceColumns.bombeo_pluma) : prev.bombeo_pluma,
        };
      }

      zonas[zona] = zonaConfig;
    }
  }
  return zonas;
}

function parseNormalizedConcreteTable(sheet: GoogleSpreadsheetWorksheet): Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>> {
  const zonas: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>> = {};
  const maxRows = Math.min(Math.max(sheet.rowCount || 120, 120), 300);
  const maxCols = Math.min(Math.max(sheet.columnCount || 12, 12), 40);

  for (let r = 0; r < maxRows; r++) {
    let resistenciaCol = -1;
    let entregaCol = -1;
    const zonaCols = new Map<ZonaCotizacion, number>();
    for (let c = 0; c < maxCols; c++) {
      const header = normTexto(celdaTexto(sheet, r, c));
      if (header.includes("resistencia") || (header.includes("f") && header.includes("c"))) resistenciaCol = c;
      if (header.includes("entrega") || header.includes("vaciado") || header.includes("bomba")) entregaCol = c;
      const zona = zonaDesdeTexto(celdaTexto(sheet, r, c));
      if (zona) zonaCols.set(zona, c);
    }
    if (resistenciaCol < 0 || entregaCol < 0 || zonaCols.size === 0) continue;

    for (let rr = r + 1; rr < maxRows; rr++) {
      const resistencia = parseResistenciaKg(celdaTexto(sheet, rr, resistenciaCol));
      const servicio = servicioDesdeHeader(celdaTexto(sheet, rr, entregaCol));
      if (resistencia == null || !servicio) {
        if (rr > r + 1 && !celdaTexto(sheet, rr, resistenciaCol) && !celdaTexto(sheet, rr, entregaCol)) break;
        continue;
      }

      for (const [zona, col] of zonaCols) {
        const precio = celdaNumero(sheet, rr, col);
        if (precio <= 0) continue;
        const zonaConfig = zonas[zona] ?? emptyZonaConfig();
        ensureResistenciaZona(zonaConfig, resistencia)[servicio] = precio;
        zonas[zona] = zonaConfig;
      }
    }

    break;
  }

  return zonas;
}

function parseBombeoEstacionaria(sheet: GoogleSpreadsheetWorksheet, zonas: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>>) {
  const maxRows = Math.min(Math.max(sheet.rowCount || 120, 120), 300);
  const maxCols = Math.min(Math.max(sheet.columnCount || 12, 12), 40);
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const n = normTexto(celdaTexto(sheet, r, c));
      if (!n.includes("tuberia") || !n.includes("mt")) continue;

      for (let hc = c + 1; hc < Math.min(c + 8, maxCols); hc++) {
        const zona = zonaDesdeTexto(celdaTexto(sheet, r, hc));
        if (!zona) continue;
        const m = celdaTexto(sheet, r, hc).match(/\((\d+(?:[.,]\d+)?)\s*m3/i);
        const minimo = m ? valorCeldaANum(m[1]) : 0;
        const zonaConfig = zonas[zona] ?? emptyZonaConfig();
        if (minimo > 0) zonaConfig.serviciosMinimosM3.estacionaria = minimo;
        const importe30m = celdaNumero(sheet, r + 1, hc);
        if (importe30m > 0) zonaConfig.servicioMinimoImporte.estacionaria = importe30m;
        zonas[zona] = zonaConfig;
      }
    }
  }
}

function parseServicioPluma(sheet: GoogleSpreadsheetWorksheet, zonas: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>>) {
  const maxRows = Math.min(Math.max(sheet.rowCount || 120, 120), 300);
  const maxCols = Math.min(Math.max(sheet.columnCount || 12, 12), 40);
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const n = normTexto(celdaTexto(sheet, r, c));
      if (n !== "zona") continue;
      const minHeader = normTexto(celdaTexto(sheet, r, c + 1));
      const importeHeader = normTexto(celdaTexto(sheet, r, c + 2));
      if (!minHeader.includes("serv") || !importeHeader.includes("importe")) continue;

      for (let rr = r + 1; rr < Math.min(r + 8, maxRows); rr++) {
        const zonaNum = Math.trunc(celdaNumero(sheet, rr, c));
        if (zonaNum < 1 || zonaNum > 4) continue;
        const zona = `Z${zonaNum}` as ZonaCotizacion;
        const zonaConfig = zonas[zona] ?? emptyZonaConfig();
        const minimo = celdaNumero(sheet, rr, c + 1);
        const importe = celdaNumero(sheet, rr, c + 2) || celdaNumero(sheet, rr, c + 3);
        if (minimo > 0) zonaConfig.serviciosMinimosM3.pluma = minimo;
        if (importe > 0) zonaConfig.servicioMinimoImporte.pluma = importe;
        zonas[zona] = zonaConfig;
      }
    }
  }
}

function parseAdicionales(sheet: GoogleSpreadsheetWorksheet): {
  aditivos: Partial<Record<AditivoCotizacion, number>>;
  resistenciasRapidas: Partial<Record<ResistenciaRapidaDias, number>>;
  tuberiaExtraTramo10mM3: number;
} {
  const aditivos: Partial<Record<AditivoCotizacion, number>> = {};
  const resistenciasRapidas: Partial<Record<ResistenciaRapidaDias, number>> = {};
  let tuberiaExtraTramo10mM3 = 0;
  const maxRows = Math.min(Math.max(sheet.rowCount || 120, 120), 300);
  const maxCols = Math.min(Math.max(sheet.columnCount || 12, 12), 40);

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const n = normTexto(celdaTexto(sheet, r, c));
      const raw = celdaTexto(sheet, r, c);
      if (!n) continue;
      const money = nearbyMoney(sheet, r, c);
      if (n.includes("fibra") && money > 0) aditivos.fibra = money;
      if (n.includes("impermeabilizante") && money > 0) aditivos.impermeabilizante = money;
      if (n.includes("rapida") && n.includes("14") && money > 0) resistenciasRapidas[14] = money;
      if (n.includes("rapida") && n.includes("7") && money > 0) resistenciasRapidas[7] = money;
      if (n.includes("rapida") && n.includes("3") && money > 0) resistenciasRapidas[3] = money;
      if (n.includes("tramo") && n.includes("10") && (n.includes("tuberia") || n.includes("metros"))) {
        const precioTexto = raw.match(/\$\s*(\d+(?:[.,]\d+)?)/) ?? raw.match(/por\s+(\d+(?:[.,]\d+)?)\s*(?:pesos|mxn)/i);
        const precio = money || (precioTexto ? valorCeldaANum(precioTexto[1]) : 0);
        if (precio > 0) tuberiaExtraTramo10mM3 = precio;
      }
    }
  }

  return { aditivos, resistenciasRapidas, tuberiaExtraTramo10mM3 };
}

function mergeZonas(
  base: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>>,
  extra: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>>,
): Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>> {
  const out = { ...base };
  for (const [zona, extraConfig] of Object.entries(extra) as Array<[ZonaCotizacion, ZonaPreciosConcreto]>) {
    const target = out[zona] ?? emptyZonaConfig();
    for (const [kg, precios] of Object.entries(extraConfig.preciosPorResistencia)) {
      target.preciosPorResistencia[kg] = {
        ...target.preciosPorResistencia[kg],
        ...Object.fromEntries(Object.entries(precios).filter(([, value]) => value > 0)),
      } as PrecioConcretoPorServicio;
    }
    target.cargoVacioM3 = target.cargoVacioM3 || extraConfig.cargoVacioM3;
    target.serviciosMinimosM3 = {
      estacionaria: target.serviciosMinimosM3.estacionaria || extraConfig.serviciosMinimosM3.estacionaria,
      pluma: target.serviciosMinimosM3.pluma || extraConfig.serviciosMinimosM3.pluma,
    };
    target.servicioMinimoImporte = {
      estacionaria: target.servicioMinimoImporte.estacionaria || extraConfig.servicioMinimoImporte.estacionaria,
      pluma: target.servicioMinimoImporte.pluma || extraConfig.servicioMinimoImporte.pluma,
    };
    out[zona] = target;
  }
  return out;
}

async function applyServiciosBombasSheet(
  sheet: GoogleSpreadsheetWorksheet | undefined,
  zonas: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>>,
): Promise<number> {
  if (!sheet) return 0;
  const rows = await sheet.getRows();
  let tuberiaExtraFromRows = 0;
  for (const row of rows) {
    const obj = row.toObject() as Record<string, unknown>;
    const tipo = normTexto(obj["Tipo de Bomba"]);
    const concepto = normTexto(obj.Concepto);
    const bomba = tipo.includes("pluma") ? "pluma" : tipo.includes("estacionaria") ? "estacionaria" : null;
    if (!bomba || !concepto) continue;
    for (const zona of ["Z1", "Z2", "Z3", "Z4"] as ZonaCotizacion[]) {
      const zonaNum = zona.slice(1);
      const value = valorCeldaANum(obj[`Zona ${zonaNum}`]);
      if (value <= 0) continue;
      const zonaConfig = zonas[zona] ?? emptyZonaConfig();
      const esTramoExtra = concepto.includes("tramo") && concepto.includes("extra");
      if (concepto.includes("m3") && !esTramoExtra) {
        zonaConfig.serviciosMinimosM3[bomba] = value;
      } else if (concepto.includes("servicio") && !esTramoExtra) {
        zonaConfig.servicioMinimoImporte[bomba] = value;
      } else if (esTramoExtra) {
        tuberiaExtraFromRows = tuberiaExtraFromRows || value;
      }
      zonas[zona] = zonaConfig;
    }
  }
  if (rows.length > 0) return tuberiaExtraFromRows;

  await loadSheetGrid(sheet);
  const maxRows = Math.min(Math.max(sheet.rowCount || 80, 80), 200);
  const maxCols = Math.min(Math.max(sheet.columnCount || 10, 10), 30);
  let tuberiaExtraTramo10mM3 = 0;

  for (let r = 0; r < maxRows; r++) {
    const zonaCols = new Map<ZonaCotizacion, number>();
    for (let c = 0; c < maxCols; c++) {
      const zona = zonaDesdeTexto(celdaTexto(sheet, r, c));
      if (zona) zonaCols.set(zona, c);
    }
    if (zonaCols.size === 0) continue;

    for (let rr = r + 1; rr < maxRows; rr++) {
      const tipo = normTexto(celdaTexto(sheet, rr, 0));
      const concepto = normTexto(celdaTexto(sheet, rr, 1));
      if (!tipo && !concepto) break;
      const bomba = tipo.includes("pluma") ? "pluma" : tipo.includes("estacionaria") ? "estacionaria" : null;
      if (!bomba) continue;

      for (const [zona, col] of zonaCols) {
        const value = celdaNumero(sheet, rr, col);
        if (value <= 0) continue;
        const zonaConfig = zonas[zona] ?? emptyZonaConfig();
        const esTramoExtra = concepto.includes("tramo") && concepto.includes("extra");
        if (concepto.includes("m3") && !esTramoExtra) {
          zonaConfig.serviciosMinimosM3[bomba] = value;
        } else if (concepto.includes("servicio") && !esTramoExtra) {
          zonaConfig.servicioMinimoImporte[bomba] = value;
        } else if (esTramoExtra) {
          tuberiaExtraTramo10mM3 = tuberiaExtraTramo10mM3 || value;
        }
        zonas[zona] = zonaConfig;
      }
    }
    break;
  }

  return tuberiaExtraTramo10mM3;
}

async function parseAdicionalesGlobalSheet(sheet: GoogleSpreadsheetWorksheet | undefined): Promise<{
  aditivos: Partial<Record<AditivoCotizacion, number>>;
  resistenciasRapidas: Partial<Record<ResistenciaRapidaDias, number>>;
  cargoVacioM3: number;
}> {
  const aditivos: Partial<Record<AditivoCotizacion, number>> = {};
  const resistenciasRapidas: Partial<Record<ResistenciaRapidaDias, number>> = {};
  let cargoVacioM3 = 0;
  if (!sheet) return { aditivos, resistenciasRapidas, cargoVacioM3 };

  await loadSheetGrid(sheet);
  const maxRows = Math.min(Math.max(sheet.rowCount || 80, 80), 200);
  for (let r = 1; r < maxRows; r++) {
    const concepto = normTexto(celdaTexto(sheet, r, 0));
    const precio = celdaNumero(sheet, r, 1);
    if (!concepto || precio <= 0) continue;
    if (concepto.includes("fibra")) aditivos.fibra = precio;
    if (concepto.includes("impermeabilizante")) aditivos.impermeabilizante = precio;
    if (concepto.includes("resistencia") && concepto.includes("14")) resistenciasRapidas[14] = precio;
    if (concepto.includes("resistencia") && concepto.includes("7")) resistenciasRapidas[7] = precio;
    if (concepto.includes("resistencia") && concepto.includes("3")) resistenciasRapidas[3] = precio;
    if (concepto.includes("vacio")) cargoVacioM3 = precio;
  }

  return { aditivos, resistenciasRapidas, cargoVacioM3 };
}

export async function fetchPreciosConcretoConfig(): Promise<CotizacionPreciosConfig> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID no está definida");
  const doc = new GoogleSpreadsheet(sheetId, getGoogleServiceAccountJwt());
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle["Precios Concreto"];
  if (!sheet) throw new Error('No existe la hoja "Precios Concreto"');

  await loadSheetGrid(sheet);
  const zonas = mergeZonas(parseNormalizedConcreteTable(sheet), parseConcreteBlocks(sheet));
  parseBombeoEstacionaria(sheet, zonas);
  parseServicioPluma(sheet, zonas);
  const adicionalesPdf = parseAdicionales(sheet);
  const tuberiaExtraFromServicios = await applyServiciosBombasSheet(doc.sheetsByTitle["Servicios Bombas"], zonas);
  const adicionalesGlobal = await parseAdicionalesGlobalSheet(doc.sheetsByTitle["Adicionales Global"]);
  for (const zonaConfig of Object.values(zonas)) {
    if (zonaConfig && zonaConfig.cargoVacioM3 <= 0) zonaConfig.cargoVacioM3 = adicionalesGlobal.cargoVacioM3;
  }

  const preciosPorResistencia: Record<string, number> = {};
  const resistenciasKg = resistenciasDesdeZonas(zonas);
  for (const kg of resistenciasKg) {
    preciosPorResistencia[String(kg)] = zonas.Z1?.preciosPorResistencia[String(kg)]?.tiro_directo ?? 0;
  }

  return {
    resistenciasKg,
    preciosPorResistencia,
    zonas,
    aditivos: { ...adicionalesPdf.aditivos, ...adicionalesGlobal.aditivos },
    resistenciasRapidas: {
      ...adicionalesPdf.resistenciasRapidas,
      ...adicionalesGlobal.resistenciasRapidas,
    },
    tuberiaExtraTramo10mM3: tuberiaExtraFromServicios || adicionalesPdf.tuberiaExtraTramo10mM3,
    fuente: "Precios Concreto",
  };
}

function resistenciasDesdeZonas(zonas: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>>): number[] {
  const out = new Set<number>();
  for (const zonaConfig of Object.values(zonas)) {
    if (!zonaConfig) continue;
    for (const [kgRaw, precios] of Object.entries(zonaConfig.preciosPorResistencia)) {
      const kg = Number(kgRaw);
      if (!Number.isFinite(kg) || kg <= 0) continue;
      if (Object.values(precios).some((precio) => Number.isFinite(precio) && precio > 0)) {
        out.add(kg);
      }
    }
  }
  return [...out].sort((a, b) => a - b);
}

export async function fetchCotizacionPreciosConfig(): Promise<CotizacionPreciosConfig> {
  return fetchPreciosConcretoConfig();
}

/** Lee A:B (precio en B). Columna A/B tiene prioridad al fusionarse con las filas con encabezado. */
async function fetchPreciosDesdeColumnasAB(sheet: GoogleSpreadsheetWorksheet): Promise<PrecioRow[]> {
  const sheetRows = sheet.rowCount || 120;
  const maxR = Math.min(Math.max(sheetRows, 24), 400);
  await sheet.loadCells(`A1:B${maxR}`);
  const out: PrecioRow[] = [];
  for (let r = 1; r <= maxR; r++) {
    const a = sheet.getCellByA1(`A${r}`);
    const b = sheet.getCellByA1(`B${r}`);
    const resistenciaStr = valorCeldaATextoResistencia(a?.value ?? "");
    const precio = valorCeldaANum(b?.value ?? "");
    if (precio <= 0) continue;
    if (parseResistenciaKg(resistenciaStr) == null) continue;
    out.push({
      Resistencia: resistenciaStr,
      Precio_m3: precio,
      Cargo_distancia: 0,
      Tipo_Vaciado: "",
    });
  }
  return out;
}

export async function fetchPreciosRows(): Promise<PrecioRow[]> {
  /* Documento nuevo por petición: así los precios reflejan cambios en Sheets de inmediato
   * (el singleton de getSpreadsheetDoc() podía dejar filas/celdas desactualizadas). */
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID no está definida");
  const doc = new GoogleSpreadsheet(sheetId, getGoogleServiceAccountJwt());
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle["Precios"];
  if (!sheet) throw new Error('No existe la hoja "Precios"');
  const rows = await sheet.getRows();
  const mapped: PrecioRow[] = rows.map((row) => {
    const rFlex = extractResistenciaFlexible(row);
    const pFlex = extractPrecioM3Flexible(row);
    const rStrict = String(row.get("Resistencia" as never) ?? "").trim();
    const pStrict = parseFloat(String(row.get("Precio_m3" as never) ?? "0").replace(",", ".")) || 0;
    return {
      Resistencia: rFlex || rStrict,
      Precio_m3: pFlex > 0 ? pFlex : pStrict,
      Cargo_distancia: parseFloat(String(row.get("Cargo_distancia" as never) ?? "0").replace(",", ".")) || 0,
      Tipo_Vaciado: String(row.get("Tipo_Vaciado" as never) ?? "").trim(),
    };
  });

  const desdeAb = await fetchPreciosDesdeColumnasAB(sheet);
  return mergePreciosRowsPreferColumnasAb(mapped, desdeAb);
}

/** Lee capacidad m³/hora. Si no está configurada, conserva el default operativo de 30 m³/hora. */
export async function fetchCapacidadMaximaHora(): Promise<number> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Config Sistema"] ?? doc.sheetsByTitle["Config"];
  if (!sheet) return 30;

  await sheet.loadCells("A1:B40");
  for (let r = 0; r < Math.min(sheet.rowCount || 40, 40); r++) {
    const key = normTexto(sheet.getCell(r, 0)?.value ?? "");
    const value = valorCeldaANum(sheet.getCell(r, 1)?.value ?? "");
    if (value > 0 && key.includes("capacidad") && (key.includes("hora") || key.includes("m3"))) {
      return value;
    }
  }

  const b1 = valorCeldaANum(sheet.getCellByA1("B1")?.value ?? "");
  return b1 > 0 ? b1 : 30;
}

export function normalizeHora(hora: string): string {
  const p = hora.trim().split(":");
  const h = parseInt(p[0] ?? "0", 10);
  const m = parseInt(p[1] ?? "0", 10);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normalizeFecha(fecha: string): string {
  const s = fecha.trim();
  if (s.includes("T")) return s.slice(0, 10);
  return s.slice(0, 10);
}

/** Semana ISO (1-53) usada por la columna "Semana" de Agenda. */
export function semanaIsoDesdeFecha(fecha: string): number {
  const normalized = normalizeFecha(fecha);
  const [yearRaw, monthRaw, dayRaw] = normalized.split("-").map((part) => Number.parseInt(part, 10));
  if (!yearRaw || !monthRaw || !dayRaw) return 0;

  const date = new Date(Date.UTC(yearRaw, monthRaw - 1, dayRaw));
  if (Number.isNaN(date.getTime())) return 0;

  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Ventana de reserva sin confirmar pago (2 h). */
export const RESERVA_HOLD_MS = 2 * 60 * 60 * 1000;

/**
 * Formato de columna Timestamp_Reserva: dd/mm/aaaa, hh:mm:ss (hora CDMX).
 * America/Mexico_City no usa DST; el offset fijo UTC−6 es suficiente para el valor almacenado.
 */
export function formatTimestampReservaCDMX(date: Date = new Date()): string {
  const tz = "America/Mexico_City";
  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart}, ${timePart}`;
}

/**
 * Interpreta Timestamp_Reserva (ISO legado o dd/mm/aaaa, hh:mm:ss en CDMX) como instante UTC.
 */
export function parseTimestampReserva(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s) || s.includes("T")) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  /** dd/mm/aaaa, hh:mm:ss (emitido por la app) o dd/mm/aaaa hh:mm:ss (locale de Sheets). */
  const m =
    s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{1,2}):(\d{1,2})$/) ??
    s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const hour = parseInt(m[4], 10);
  const minute = parseInt(m[5], 10);
  const second = parseInt(m[6], 10);
  // CDMX (UTC−6): instante = UTC ms con +6 h respecto a hora local civil
  const ms = Date.UTC(year, month - 1, day, hour + 6, minute, second);
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

function esReservaExpirada(timestampStr: string, ahora: Date): boolean {
  const t = parseTimestampReserva(timestampStr);
  if (!t) return false;
  return ahora.getTime() - t.getTime() > RESERVA_HOLD_MS;
}

/**
 * Estados: Disponible, Reservado, Pagado (solo manual), Cancelado.
 * Pagado y Reservado vigente ocupan cupo; Cancelado / Disponible / Reservado vencido no.
 * "confirmado" se trata como legado de pagado.
 */
export function ocupaCupoEnAgenda(estadoRaw: string, timestampReserva: string, ahora: Date): boolean {
  const estado = estadoRaw.trim().toLowerCase();
  if (estado === "cancelado" || estado === "disponible") return false;
  if (estado === "pagado" || estado === "confirmado") return true;
  if (estado === "reservado") {
    if (!timestampReserva.trim()) return true;
    return !esReservaExpirada(timestampReserva, ahora);
  }
  return false;
}

/** Suma volúmenes en Agenda para fecha+hora; libera Reservados vencidos (→ Disponible). */
export async function sumarVolumenAgendado(fecha: string, hora: string): Promise<number> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Agenda"];
  if (!sheet) throw new Error('No existe la hoja "Agenda"');
  const rows = await sheet.getRows();
  const f = normalizeFecha(fecha);
  const h = normalizeHora(hora);
  const ahora = new Date();
  let sum = 0;
  for (const row of rows) {
    const estadoRaw = String(row.get("Estado") ?? "").trim();
    const estado = estadoRaw.toLowerCase();
    const tsStr = String(row.get("Timestamp_Reserva") ?? "").trim();

    /** Solo filas en Reservado: Pagado / Cancelado / Confirmado no se modifican aquí. */
    if (estado === "reservado" && tsStr && esReservaExpirada(tsStr, ahora)) {
      row.set("Estado", "Disponible");
      await row.save();
      continue;
    }

    if (!ocupaCupoEnAgenda(estadoRaw, tsStr, ahora)) continue;

    const rf = normalizeFecha(String(row.get("Fecha") ?? ""));
    const rh = normalizeHora(String(row.get("Hora") ?? "0:0"));
    if (rf === f && rh === h) {
      sum += parseFloat(String(row.get("Volumen") ?? "0")) || 0;
    }
  }
  return sum;
}

export interface ReservaPayload {
  Nombre: string;
  Empresa: string;
  Obra: string;
  Fecha: string;
  Hora: string;
  Volumen: number;
  /** "Tiro Directo" | "Bombeo" — columna Vaciado en Agenda */
  Vaciado: string;
  /** kg/cm² admitidos (catálogo cotizador / columna Agenda "Resistencia f'c") */
  "Resistencia f'c": number;
  /** Total estimado de la cotización (MXN) — columna Cotización */
  Cotización: number;
  Comentarios: string;
  Estado: string;
  Timestamp_Reserva: string;
  Semana: number;
  UbicacionObra?: string;
  RutaMaps?: string;
  Zona?: string;
  Distancia?: string;
  Duracion?: string;
  TipoBomba?: string;
  MetrosTuberia?: number;
  Aditivos?: string;
  ResistenciaRapida?: string;
  PrecioM3?: number;
  Desglose?: string;
}

export interface VisitaAgendadaSheetPayload {
  Nombre: string;
  Empresa: string;
  Correo: string;
  Telefono: string;
  Fecha: string;
  Horario: string;
  Visita: TipoVisitaAgendada;
}

/** Nombre canónico y variante frecuente en hojas ya creadas. */
function getSheetVisitasAgendadas(doc: GoogleSpreadsheet): GoogleSpreadsheetWorksheet | undefined {
  return doc.sheetsByTitle["Visitas Agendadas"] ?? doc.sheetsByTitle["Visitas Agendades"];
}

const VISITAS_AGENDADAS_HEADERS = ["Nombre", "Empresa", "Correo", "WA - Teléfono", "Fecha", "Horario", "Visita"] as const;

async function assertVisitasAgendadasHeaders(sheet: GoogleSpreadsheetWorksheet): Promise<void> {
  await sheet.loadHeaderRow();
  const missing = VISITAS_AGENDADAS_HEADERS.filter((header) => !sheet.headerValues.includes(header));
  if (missing.length > 0) {
    throw new Error(`Faltan encabezados en "Visitas Agendadas": ${missing.join(", ")}`);
  }
}

/**
 * Inserta una fila nueva al final de la pestaña «Visitas Agendadas».
 * Siempre usa {@link GoogleSpreadsheetWorksheet.addRow} con insert=true para insertar filas nuevas,
 * no sobrescribir el rango detectado por Google Sheets.
 *
 * Las llaves del objeto deben coincidir **carácter por carácter** con los encabezados del Sheet:
 * Nombre, Empresa, Correo, WA - Teléfono, Fecha, Horario, Visita.
 */
export async function appendVisitaAgendadaRow(payload: VisitaAgendadaSheetPayload): Promise<void> {
  const doc = await getSpreadsheetDoc();
  const sheet = getSheetVisitasAgendadas(doc);
  if (!sheet) {
    throw new Error('No existe la hoja "Visitas Agendadas" ni "Visitas Agendades"');
  }
  await assertVisitasAgendadasHeaders(sheet);
  await sheet.addRow({
    Nombre: payload.Nombre,
    Empresa: payload.Empresa,
    Correo: payload.Correo,
    "WA - Teléfono": payload.Telefono,
    Fecha: normalizeFecha(payload.Fecha),
    Horario: normalizeHora(payload.Horario),
    Visita: payload.Visita,
  }, { insert: true });
}

export async function appendReservaAgenda(payload: ReservaPayload): Promise<void> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Agenda"];
  if (!sheet) throw new Error('No existe la hoja "Agenda"');
  await assertAgendaHeaders(sheet);

  const row: Record<string, string | number> = {
    Nombre: payload.Nombre,
    Empresa: payload.Empresa,
    Obra: payload.Obra,
    Fecha: normalizeFecha(payload.Fecha),
    Hora: normalizeHora(payload.Hora),
    Volumen: payload.Volumen,
    Vaciado: payload.Vaciado,
    "Resistencia f'c": payload["Resistencia f'c"],
    Cotización: payload.Cotización,
    Estado: payload.Estado,
    Timestamp_Reserva: payload.Timestamp_Reserva,
    Comentarios: payload.Comentarios,
    Semana: payload.Semana,
  };

  const optionalColumns: Array<[string, string | number | undefined]> = [
    ["Ubicación obra", payload.UbicacionObra],
    ["Ruta Maps", payload.RutaMaps],
    ["Zona", payload.Zona],
    ["Distancia", payload.Distancia],
    ["Duración", payload.Duracion],
    ["Tipo bomba", payload.TipoBomba],
    ["Metros tubería", payload.MetrosTuberia],
    ["Aditivos", payload.Aditivos],
    ["Resistencia rápida", payload.ResistenciaRapida],
    ["Precio m3", payload.PrecioM3],
    ["Desglose", payload.Desglose],
  ];

  for (const [header, value] of optionalColumns) {
    if (value !== undefined && value !== "" && sheet.headerValues.includes(header)) {
      row[header] = value;
    }
  }

  await writeAgendaRow(sheet, row);
}

async function writeAgendaRow(sheet: GoogleSpreadsheetWorksheet, row: Record<string, string | number>): Promise<void> {
  const targetRow = await findFirstEmptyAgendaRow(sheet);
  if (targetRow == null) {
    await sheet.addRow(row, { insert: true });
    return;
  }

  for (const [header, value] of Object.entries(row)) {
    const col = sheet.headerValues.indexOf(header);
    if (col < 0) continue;
    sheet.getCell(targetRow, col).value = value;
  }
  await sheet.saveUpdatedCells();
}

async function findFirstEmptyAgendaRow(sheet: GoogleSpreadsheetWorksheet): Promise<number | null> {
  const rows = Math.min(Math.max(sheet.rowCount || 100, 100), 1000);
  const cols = Math.max(sheet.headerValues.length, AGENDA_HEADERS.length);
  const lastCol = columnToA1(cols - 1);
  await sheet.loadCells(`A1:${lastCol}${rows}`);

  for (let row = 1; row < rows; row++) {
    const isEmpty = sheet.headerValues.every((_, col) => {
      const value = sheet.getCell(row, col)?.value;
      return value == null || String(value).trim() === "";
    });
    if (isEmpty) return row;
  }

  return null;
}

const AGENDA_HEADERS = [
  "Nombre",
  "Empresa",
  "Obra",
  "Vaciado",
  "Fecha",
  "Hora",
  "Volumen",
  "Resistencia f'c",
  "Estado",
  "Timestamp_Reserva",
  "Cotización",
  "Comentarios",
  "Semana",
] as const;

async function assertAgendaHeaders(sheet: GoogleSpreadsheetWorksheet): Promise<void> {
  await sheet.loadHeaderRow();
  const missing = AGENDA_HEADERS.filter((header) => !sheet.headerValues.includes(header));
  if (missing.length > 0) {
    throw new Error(`Faltan encabezados en "Agenda": ${missing.join(", ")}`);
  }
}
