/**
 * Solo para entorno servidor (Route Handlers). No importar desde componentes cliente.
 */
import { JWT } from "google-auth-library";
import type { GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { GoogleSpreadsheet } from "google-spreadsheet";
import type { TipoVisitaAgendada } from "@/lib/agendaVisita";
import {
  RESISTENCIAS_KG,
  buildCotizacionConfigFromRows,
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
import { normalizeHoraSlot, type IntervalMinutes } from "@/lib/agendaCapacity";

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

function isSheets403Error(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const status = (e as { response?: { status?: number } }).response?.status;
  if (status === 403) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("[403]") || msg.includes("does not have permission");
}

function sheetsPermissionError(): Error {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "GOOGLE_SERVICE_ACCOUNT_EMAIL";
  const sheetId = process.env.GOOGLE_SHEET_ID ?? "";
  return new Error(
    `Google Sheets: sin permiso (403). Abre la hoja ${sheetId} → Compartir → añade ${email} como Editor.`,
  );
}

async function loadSpreadsheetInfo(doc: GoogleSpreadsheet): Promise<void> {
  try {
    await doc.loadInfo();
  } catch (e) {
    if (isSheets403Error(e)) throw sheetsPermissionError();
    throw e;
  }
}

function normSheetTitleKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findSheetByTitleCandidates(
  doc: GoogleSpreadsheet,
  candidates: string[],
): GoogleSpreadsheetWorksheet | undefined {
  for (const name of candidates) {
    const sheet = doc.sheetsByTitle[name];
    if (sheet) return sheet;
  }
  const wanted = new Set(candidates.map(normSheetTitleKey));
  for (const sheet of doc.sheetsByIndex) {
    if (wanted.has(normSheetTitleKey(sheet.title))) return sheet;
  }
  return undefined;
}

/** Pestaña de precios del cotizador (Footer / Narváez: «Precios concretos», legado: «Precios Concreto»). */
function findPreciosConcretoSheet(doc: GoogleSpreadsheet): GoogleSpreadsheetWorksheet | undefined {
  const named = findSheetByTitleCandidates(doc, [
    "Precios concretos",
    "Precios Concreto",
    "Precios Concretos",
    "Precios concreto",
  ]);
  if (named) return named;
  for (const sheet of doc.sheetsByIndex) {
    const key = normSheetTitleKey(sheet.title);
    if (key.includes("precio") && key.includes("concreto")) return sheet;
  }
  return undefined;
}

export async function getSpreadsheetDoc(): Promise<GoogleSpreadsheet> {
  if (docSingleton) return docSingleton;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID no está definida");

  const auth = getGoogleServiceAccountJwt();

  const doc = new GoogleSpreadsheet(sheetId, auth);
  await loadSpreadsheetInfo(doc);
  docSingleton = doc;
  return doc;
}

/** Recarga metadatos del spreadsheet (pestañas nuevas o renombradas). Útil antes de escribir en Bloqueos_Logistica. */
export async function reloadSpreadsheetDocInfo(): Promise<GoogleSpreadsheet> {
  const doc = await getSpreadsheetDoc();
  await loadSpreadsheetInfo(doc);
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
  await loadSpreadsheetInfo(doc);
  const sheet = findPreciosConcretoSheet(doc);
  if (!sheet) {
    const tabs = doc.sheetsByIndex.map((s) => `"${s.title}"`).join(", ");
    throw new Error(
      `No existe la hoja de precios ("Precios concretos" / "Precios Concreto"). Pestañas en el documento: ${tabs || "(ninguna)"}`,
    );
  }

  await loadSheetGrid(sheet);
  const zonas = mergeZonas(parseNormalizedConcreteTable(sheet), parseConcreteBlocks(sheet));
  parseBombeoEstacionaria(sheet, zonas);
  parseServicioPluma(sheet, zonas);
  const adicionalesPdf = parseAdicionales(sheet);
  const tuberiaExtraFromServicios = await applyServiciosBombasSheet(doc.sheetsByTitle["Servicios Bombas"], zonas);
  const adicionalesGlobal = await parseAdicionalesGlobalSheet(doc.sheetsByTitle["Adicionales Global"]);
  const sistemaExtras = await fetchConfigSistemaCotizacionExtras(doc);
  for (const zonaConfig of Object.values(zonas)) {
    if (zonaConfig && zonaConfig.cargoVacioM3 <= 0) zonaConfig.cargoVacioM3 = adicionalesGlobal.cargoVacioM3;
  }

  const aditivos = { ...adicionalesPdf.aditivos, ...adicionalesGlobal.aditivos };
  const resistenciasRapidas = {
    ...adicionalesPdf.resistenciasRapidas,
    ...adicionalesGlobal.resistenciasRapidas,
  };
  const extras = {
    tuberiaExtraTramo10mM3: tuberiaExtraFromServicios || adicionalesPdf.tuberiaExtraTramo10mM3,
    volumenMaximoCotizadorM3: sistemaExtras.volumenMaximoCotizadorM3,
  };

  let resistenciasKg = resistenciasDesdeZonas(zonas);
  if (resistenciasKg.length === 0) {
    const simple = buildCotizacionConfigFromRows(await fetchPreciosDesdeColumnasAB(sheet));
    if ((simple.resistenciasKg?.length ?? 0) > 0) {
      return {
        ...simple,
        ...extras,
        aditivos,
        resistenciasRapidas,
        fuente: "Precios Concreto",
      };
    }
  }

  const preciosPorResistencia: Record<string, number> = {};
  for (const kg of resistenciasKg) {
    preciosPorResistencia[String(kg)] = zonas.Z1?.preciosPorResistencia[String(kg)]?.tiro_directo ?? 0;
  }

  return {
    resistenciasKg,
    preciosPorResistencia,
    zonas,
    aditivos,
    resistenciasRapidas,
    ...extras,
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
  await loadSpreadsheetInfo(doc);
  const sheet =
    findSheetByTitleCandidates(doc, ["Precios", "Precios concretos", "Precios Concreto"]) ??
    findPreciosConcretoSheet(doc);
  if (!sheet) throw new Error('No existe la hoja "Precios" ni "Precios concretos"');
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

/** Lee capacidad m³/hora. Si no está configurada, conserva el default operativo de 50 m³/hora. */
export async function fetchCapacidadMaximaHora(): Promise<number> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Config Sistema"] ?? doc.sheetsByTitle["Config"];
  if (!sheet) return 50;

  await sheet.loadCells("A1:B40");
  for (let r = 0; r < Math.min(sheet.rowCount || 40, 40); r++) {
    const key = normTexto(sheet.getCell(r, 0)?.value ?? "");
    const value = valorCeldaANum(sheet.getCell(r, 1)?.value ?? "");
    if (value > 0 && key.includes("capacidad") && (key.includes("hora") || key.includes("m3"))) {
      return value;
    }
  }

  const b1 = valorCeldaANum(sheet.getCellByA1("B1")?.value ?? "");
  return b1 > 0 ? b1 : 50;
}

/** Valores por fila A:B en «Config Sistema» (o «Config»). */
const DEFAULT_VOLUMEN_MAX_COTIZADOR_M3 = 100;

/**
 * Lee límite de volumen del cotizador en línea desde «Config Sistema» (columna A = concepto, B = valor).
 * - Volumen máximo cotizador: fila con «volumen» y «max»/«limite»/«cotizador»/«online», sin «min».
 */
export async function fetchConfigSistemaCotizacionExtras(
  docArg?: GoogleSpreadsheet,
): Promise<{ volumenMaximoCotizadorM3: number }> {
  let volumen = DEFAULT_VOLUMEN_MAX_COTIZADOR_M3;

  const doc = docArg ?? (await getSpreadsheetDoc());
  const sheet = doc.sheetsByTitle["Config Sistema"] ?? doc.sheetsByTitle["Config"];
  if (!sheet) {
    return { volumenMaximoCotizadorM3: volumen };
  }

  await sheet.loadCells("A1:B40");
  const maxRow = Math.min(sheet.rowCount || 40, 40);
  for (let r = 0; r < maxRow; r++) {
    const key = normTexto(sheet.getCell(r, 0)?.value ?? "");
    const value = valorCeldaANum(sheet.getCell(r, 1)?.value ?? "");
    if (!key || value <= 0) continue;

    const volumenMatch =
      key.includes("volumen") &&
      (key.includes("max") || key.includes("limite") || key.includes("cotizador") || key.includes("online")) &&
      !key.includes("min") &&
      !key.includes("minimo");

    if (volumenMatch) volumen = value;
  }

  return {
    volumenMaximoCotizadorM3: volumen > 0 ? volumen : DEFAULT_VOLUMEN_MAX_COTIZADOR_M3,
  };
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
 * Estados en Agenda (hoja): la app escribe "Agendado". El asistente ajusta manualmente
 * Pagado, Cancelado, Disponible y Reservado.
 *
 * Ocupan cupo del cotizador: Agendado, Reservado, Pagado (y legado "confirmado").
 * No ocupan: Cancelado, Disponible.
 */
export function ocupaCupoEnAgenda(estadoRaw: string): boolean {
  const estado = estadoRaw.trim().toLowerCase();
  if (estado === "cancelado" || estado === "disponible") return false;
  if (estado === "pagado" || estado === "confirmado") return true;
  if (estado === "agendado") return true;
  if (estado === "reservado") return true;
  return false;
}

/** Suma volúmenes en Agenda para fecha+hora. */
export async function sumarVolumenAgendado(fecha: string, hora: string): Promise<number> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Agenda"];
  if (!sheet) throw new Error('No existe la hoja "Agenda"');
  const rows = await sheet.getRows();
  const f = normalizeFecha(fecha);
  const h = normalizeHora(hora);
  let sum = 0;

  for (const row of rows) {
    const estadoRaw = String(row.get("Estado") ?? "").trim();

    if (!ocupaCupoEnAgenda(estadoRaw)) continue;

    const rf = normalizeFecha(String(row.get("Fecha") ?? ""));
    const rh = normalizeHora(String(row.get("Hora") ?? "0:0"));
    if (rf === f && rh === h) {
      const volCell = row.get("Volumén") ?? row.get("Volumen") ?? "0";
      sum += parseFloat(String(volCell)) || 0;
    }
  }
  return sum;
}

/** Día civil yyyy-MM-dd en zona CDMX (solo fecha); coherente con Agenda/cotizador. */
function fechaCeldaMexicoAYmdDesdeDate(cell: Date): string | null {
  if (Number.isNaN(cell.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(cell);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) return null;
  return `${y}-${m}-${d}`;
}

/** Parte entera serial Excel/Sheets (solo fecha) → yyyy-MM-dd en CDMX. */
function fechaCeldaMexicoAYmdDesdeSerial(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  const whole = Math.floor(serial);
  const excelEpochUtcMs = Date.UTC(1899, 11, 30);
  const ms = excelEpochUtcMs + whole * 86400000;
  return fechaCeldaMexicoAYmdDesdeDate(new Date(ms));
}

/**
 * yyyy-MM-dd desde celda (texto **d/m/y** típico MX, ISO, Date o serial Excel).
 * `12/5/2026` → **2026-05-12** (12 de mayo). Para evitar ambigüedad usa ISO en Sheets si hace falta.
 */
export function fechaCeldaAgendaAYmd(cell: unknown): string | null {
  if (cell instanceof Date && !Number.isNaN(cell.getTime())) {
    return fechaCeldaMexicoAYmdDesdeDate(cell);
  }
  if (typeof cell === "number" && Number.isFinite(cell)) {
    if (cell > 20000 && cell < 120000) {
      const fromSerial = fechaCeldaMexicoAYmdDesdeSerial(cell);
      if (fromSerial) return fromSerial;
    }
  }
  const s = String(cell ?? "").trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (dmY) {
    const dd = dmY[1]!.padStart(2, "0");
    const mm = dmY[2]!.padStart(2, "0");
    return `${dmY[3]}-${mm}-${dd}`;
  }
  return null;
}

/** HH:mm 24 h desde Date interpretado en CDMX. */
function horaDesdeDateMexico(cell: Date): string | null {
  if (Number.isNaN(cell.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(cell);
  const hh = parts.find((p) => p.type === "hour")?.value;
  const mm = parts.find((p) => p.type === "minute")?.value;
  if (!hh || !mm) return null;
  return `${hh}:${mm}`;
}

/**
 * Minutos desde medianoche: 24 h, fracción día (Sheets), `8:00:00 a.m.`, `2:30 pm`, etc.
 */
export function horaCeldaAMinutos(cell: unknown): number | null {
  if (cell instanceof Date && !Number.isNaN(cell.getTime())) {
    const hm = horaDesdeDateMexico(cell);
    if (!hm) return null;
    const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }

  if (typeof cell === "number" && Number.isFinite(cell)) {
    const frac = cell >= 1 ? cell % 1 : cell;
    if (frac >= 0 && frac < 1) {
      const total = Math.round(frac * 24 * 60);
      if (total < 0 || total > 24 * 60) return null;
      return Math.min(total, 23 * 60 + 59);
    }
    return null;
  }

  let s = String(cell ?? "").trim();
  if (!s) return null;
  s = s.replace(/\u202f|\u00a0/g, " ").replace(/\s+/g, " ").trim();

  let meridiem: "am" | "pm" | null = null;
  let core = s;
  if (/\bp\.?\s*m\.?\s*$/i.test(s)) {
    meridiem = "pm";
    core = s.replace(/\s*p\.?\s*m\.?\s*$/i, "").trim();
  } else if (/\ba\.?\s*m\.?\s*$/i.test(s)) {
    meridiem = "am";
    core = s.replace(/\s*a\.?\s*m\.?\s*$/i, "").trim();
  }

  const m24 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(core);
  if (!m24) return null;

  let hh = parseInt(m24[1]!, 10);
  const mm = parseInt(m24[2]!, 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || mm < 0 || mm > 59) return null;

  if (meridiem === "pm") {
    if (hh !== 12) hh += 12;
  } else if (meridiem === "am") {
    if (hh === 12) hh = 0;
  } else if (hh >= 24 || hh < 0) {
    return null;
  }

  return hh * 60 + mm;
}

/**
 * Todos los pedidos que ocupan cupo en Agenda para un día (incl. filas manuales del asistente).
 * Cada fila aporta hora de inicio + volumen total del pedido (la cascada se calcula en {@link agendaCapacity}).
 */
export async function fetchPedidosAgendaOcupanCupoParaDia(fecha: string): Promise<{ hora: string; volumen: number }[]> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Agenda"];
  if (!sheet) throw new Error('No existe la hoja "Agenda"');
  const rows = await sheet.getRows();
  const f = normalizeFecha(fecha);
  const out: { hora: string; volumen: number }[] = [];

  for (const row of rows) {
    const estadoRaw = String(row.get("Estado") ?? "").trim();
    if (!ocupaCupoEnAgenda(estadoRaw)) continue;

    const rf = normalizeFecha(String(row.get("Fecha") ?? ""));
    if (rf !== f) continue;

    const rh = normalizeHora(String(row.get("Hora") ?? "0:0"));
    const volCell = row.get("Volumén") ?? row.get("Volumen") ?? "0";
    const volumen = parseFloat(String(volCell)) || 0;
    if (volumen <= 0) continue;

    out.push({ hora: rh, volumen });
  }

  return out;
}

function bloqueosSheetDesdeDoc(doc: GoogleSpreadsheet): GoogleSpreadsheetWorksheet | undefined {
  return (
    doc.sheetsByTitle["Bloqueos_Logistica"] ??
    doc.sheetsByTitle["Bloqueos Logistica"] ??
    doc.sheetsByTitle["Bloqueos_Logisticos"] ??
    doc.sheetsByTitle["Bloqueos Logisticos"] ??
    doc.sheetsByTitle["bloqueos_logistica"] ??
    doc.sheetsByTitle["bloqueos_logisticos"]
  );
}

function pickBloqueosColumnKey(headers: readonly string[], predicate: (norm: string) => boolean): string | null {
  for (const raw of headers) {
    const s = String(raw ?? "").trim();
    if (!s) continue;
    if (predicate(normHeader(s))) return s;
  }
  return null;
}

async function ensureBloqueosLogisticaVolumenM3Column(sheet: GoogleSpreadsheetWorksheet): Promise<void> {
  const headers = sheet.headerValues;
  const hasVol = pickBloqueosColumnKey(
    headers,
    (n) =>
      (n.includes("volumen") && (n.includes("m3") || n.includes("m³"))) ||
      n.replace(/\s/g, "_") === "volumen_m3",
  );
  if (hasVol) return;

  const colIndex = Math.max(0, headers.length);
  const needCols = colIndex + 1;
  if ((sheet.columnCount || 0) <= colIndex) {
    await sheet.resize({
      rowCount: Math.max(sheet.rowCount || 100, 100),
      columnCount: Math.max(needCols + 2, 8),
    });
  }
  const a1 = `${columnToA1(colIndex)}1`;
  await sheet.loadCells(a1);
  sheet.getCell(0, colIndex).value = "Volumen_m3";
  await sheet.saveUpdatedCells();
  await sheet.loadHeaderRow();
}

/** Capacidad por defecto (m³/hora) cuando no hay configuración en «Config Sistema». */
export const CAPACIDAD_BASE_M3_HORA = 50;

/** Encabezados canónicos de la hoja Bloqueos_Logistica. */
const BLOQUEOS_LOGISTICA_HEADERS = ["Fecha", "Hora_Inicio", "Hora_Fin", "Motivo", "Volumen_m3"] as const;

/**
 * Resultado de leer Bloqueos_Logistica para un día.
 * - `intervals`: bloqueos rígidos (filas sin Volumen_m3) → la hora tocada queda con capacidad 0.
 * - `cascadeOrders`: filas con Volumen_m3 > 0 → consumen capacidad en cascada (igual que un pedido en Agenda).
 */
export interface BloqueosLogisticaDia {
  intervals: IntervalMinutes[];
  cascadeOrders: { hora: string; volumen: number }[];
}

function mmToHm(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/**
 * Lee Bloqueos_Logistica para un día (yyyy-MM-dd).
 * Pestaña esperada: Bloqueos_Logistica — columnas Fecha (DD/MM/AAAA), Hora_Inicio (HH:mm), Hora_Fin (HH:mm), Motivo, Volumen_m3.
 *
 * Comportamiento:
 * - Si la fila tiene Motivo «Cancelado», se ignora por completo (no cuenta franja ni volumen).
 * - Si la fila tiene Volumen_m3 > 0 se trata como pedido en cascada (Hora_Inicio + volumen → consume capacidad por hora).
 * - Si no, se trata como bloqueo rígido [Hora_Inicio, Hora_Fin) que pone la capacidad a 0 en las horas tocadas.
 *
 * Si la hoja no existe, devuelve listas vacías.
 */
export async function fetchBloqueosLogisticaIntervalsForDay(fechaYmd: string): Promise<BloqueosLogisticaDia> {
  const target = normalizeFecha(fechaYmd);
  const doc = await getSpreadsheetDoc();
  const sheet = bloqueosSheetDesdeDoc(doc);
  if (!sheet) {
    console.log(
      "[Bloqueos_Logistica]",
      JSON.stringify({
        fechaConsulta: target,
        intervalosCount: 0,
        cascadaCount: 0,
        filasHoja: 0,
        error: "hoja_no_encontrada",
      }),
    );
    return { intervals: [], cascadeOrders: [] };
  }

  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();
  const intervals: IntervalMinutes[] = [];
  const cascadeOrders: { hora: string; volumen: number }[] = [];

  for (const row of rows) {
    const obj = row.toObject() as Record<string, unknown>;
    let fechaVal: unknown;
    let iniVal: unknown;
    let finVal: unknown;
    let volVal: unknown;
    let motivoVal: unknown;

    for (const [k, v] of Object.entries(obj)) {
      const kn = normHeader(k);
      if (kn === "fecha") fechaVal = fechaVal ?? v;
      else if (kn.includes("hora") && kn.includes("inicio")) iniVal = iniVal ?? v;
      else if (kn.includes("hora") && (kn.includes("fin") || kn.includes("final"))) finVal = finVal ?? v;
      else if (kn.includes("volumen") || /\bvol\b/.test(kn)) volVal = volVal ?? v;
      else if (kn === "motivo") motivoVal = motivoVal ?? v;
    }

    fechaVal = fechaVal ?? row.get("Fecha" as never);
    iniVal = iniVal ?? row.get("Hora_Inicio" as never) ?? row.get("Hora Inicio" as never);
    finVal = finVal ?? row.get("Hora_Fin" as never) ?? row.get("Hora Fin" as never);
    volVal = volVal ?? row.get("Volumen_m3" as never) ?? row.get("Volumen m3" as never) ?? row.get("Volumen" as never);
    motivoVal = motivoVal ?? row.get("Motivo" as never);

    const fy = fechaCeldaAgendaAYmd(fechaVal);
    if (!fy || fy !== target) continue;

    if (normTexto(motivoVal) === "cancelado") continue;

    const start = horaCeldaAMinutos(iniVal);
    if (start == null) continue;

    const volumen = valorCeldaANum(volVal);

    if (volumen > 0) {
      cascadeOrders.push({ hora: mmToHm(start), volumen });
      continue;
    }

    const endRaw = horaCeldaAMinutos(finVal);
    if (endRaw == null) continue;
    let end = endRaw;
    if (end <= start) end += 24 * 60;
    intervals.push({ start, end });
  }

  console.log(
    "[Bloqueos_Logistica]",
    JSON.stringify({
      fechaConsulta: target,
      intervalosCount: intervals.length,
      cascadaCount: cascadeOrders.length,
      filasHoja: rows.length,
      intervalos: intervals.map((iv) => ({
        inicio: mmToHm(iv.start),
        fin: mmToHm(iv.end),
        minutos: iv,
      })),
      cascada: cascadeOrders,
    }),
  );

  return { intervals, cascadeOrders };
}

/**
 * Inserta una fila en Bloqueos_Logistica representando la ocupación de la planta por una reserva web.
 * Calcula `Hora_Fin` = `Hora_Inicio` + ceil(volumen / capacidadM3PorHora × 60) minutos.
 * Devuelve la fila creada para poder revertirla si falla el guardado en Agenda.
 */
export async function appendBloqueoLogisticaOcupacion(input: {
  /** yyyy-MM-dd */
  fecha: string;
  /** HH:mm 24h */
  horaInicio: string;
  /** Volumen del pedido en m³ (debe ser > 0). */
  volumenM3: number;
  /** m³/hora que produce la planta (típicamente 50). */
  capacidadM3PorHora: number;
  /** Texto opcional para columna Motivo (por defecto «Ocupado»). */
  motivo?: string;
  /** Columna «Ubicación» en Bloqueos_Logistica (texto de la cotización). */
  ubicacion?: string;
}): Promise<{
  horaFin: string;
  duracionMinutos: number;
  bloqueoRow: GoogleSpreadsheetRow;
}> {
  if (!Number.isFinite(input.volumenM3) || input.volumenM3 <= 0) {
    throw new Error("appendBloqueoLogisticaOcupacion: volumenM3 debe ser > 0");
  }
  if (!Number.isFinite(input.capacidadM3PorHora) || input.capacidadM3PorHora <= 0) {
    throw new Error("appendBloqueoLogisticaOcupacion: capacidadM3PorHora debe ser > 0");
  }

  const fechaYmd = normalizeFecha(input.fecha);
  const horaInicio = normalizeHora(input.horaInicio);
  const startMins = horaCeldaAMinutos(horaInicio);
  if (startMins == null) {
    throw new Error(`appendBloqueoLogisticaOcupacion: horaInicio inválida (${input.horaInicio})`);
  }

  const duracionMinutos = Math.max(1, Math.ceil((input.volumenM3 * 60) / input.capacidadM3PorHora));
  const endMinsRaw = startMins + duracionMinutos;
  const endMins = endMinsRaw % (24 * 60);
  const horaFin = mmToHm(endMins);

  await reloadSpreadsheetDocInfo();
  const doc = await getSpreadsheetDoc();
  const sheet = bloqueosSheetDesdeDoc(doc);
  if (!sheet) {
    throw new Error(
      'No existe la hoja de bloqueos. Añade una pestaña «Bloqueos_Logistica» (o «Bloqueos_Logisticos») con: Fecha, Hora_Inicio, Hora_Fin, Motivo, Volumen_m3.',
    );
  }

  await sheet.loadHeaderRow();
  const headersEmpty =
    sheet.headerValues.length === 0 || sheet.headerValues.every((h) => !String(h ?? "").trim());
  if (headersEmpty) {
    await sheet.setHeaderRow([...BLOQUEOS_LOGISTICA_HEADERS]);
    await sheet.loadHeaderRow();
  }

  await ensureBloqueosLogisticaVolumenM3Column(sheet);

  const h = sheet.headerValues;
  const kFecha = pickBloqueosColumnKey(h, (n) => n === "fecha");
  const kIni = pickBloqueosColumnKey(h, (n) => n.includes("hora") && n.includes("inicio"));
  const kFin = pickBloqueosColumnKey(h, (n) => n.includes("hora") && (n.includes("fin") || n.includes("final")));
  const kMotivo = pickBloqueosColumnKey(h, (n) => n === "motivo");
  const kVol = pickBloqueosColumnKey(
    h,
    (n) =>
      (n.includes("volumen") && (n.includes("m3") || n.includes("m³"))) ||
      n.replace(/\s/g, "_") === "volumen_m3",
  );

  if (!kFecha || !kIni || !kFin || !kMotivo || !kVol) {
    throw new Error(
      `Bloqueos_Logistica: no se pudieron mapear columnas. Encabezados actuales: «${h.join("», «")}». Se necesitan Fecha, Hora de inicio, Hora de fin, Motivo y Volumen (m³).`,
    );
  }

  const kUbic = pickBloqueosColumnKey(h, (n) => n === "ubicacion");

  const fechaCelda = fechaYmdADdMmYyyy(fechaYmd);
  const motivo = (input.motivo ?? "Ocupado").trim() || "Ocupado";
  const ubicacionTxt = (input.ubicacion ?? "").trim();

  const row: Record<string, string | number> = {
    [kFecha]: fechaCelda,
    [kIni]: horaInicio,
    [kFin]: horaFin,
    [kMotivo]: motivo,
    [kVol]: input.volumenM3,
  };
  if (kUbic && ubicacionTxt) row[kUbic] = ubicacionTxt;

  const bloqueoRow = await sheet.addRow(row, { insert: true });

  console.log(
    "[Bloqueos_Logistica:append]",
    JSON.stringify({
      fecha: fechaYmd,
      horaInicio,
      horaFin,
      duracionMinutos,
      volumenM3: input.volumenM3,
      capacidadM3PorHora: input.capacidadM3PorHora,
      motivo,
    }),
  );

  return { horaFin, duracionMinutos, bloqueoRow };
}

/**
 * Llave única alineada con {@link mergeOrdersConDedup} (mismo día): hora normalizada + volumen.
 * Evita duplicar filas en Bloqueos_Logistica al espejar Agenda.
 */
function espejoAgendaBloqueoKey(hora: string, volumen: number): string {
  return `${normalizeHoraSlot(hora)}|${Number(volumen)}`;
}

/**
 * Si en Agenda hay un pedido con Estado «Cancelado» y en Bloqueos_Logistica sigue habiendo
 * una fila espejo con la misma llave (Hora + Volumen_m3), actualiza Motivo a «Cancelado»
 * (no borra filas). Así la siguiente lectura de disponibilidad libera el cupo.
 */
export async function syncAgendaCanceladosMotivoEnBloqueosLogistica(fechaYmd: string): Promise<void> {
  const target = normalizeFecha(fechaYmd);
  try {
    const doc = await getSpreadsheetDoc();
    const agendaSheet = doc.sheetsByTitle["Agenda"];
    const bloqueosSheetOr = bloqueosSheetDesdeDoc(doc);
    if (!agendaSheet || !bloqueosSheetOr) return;

    await agendaSheet.loadHeaderRow();
    const agendaRows = await agendaSheet.getRows();
    const cancelledKeys = new Set<string>();

    for (const row of agendaRows) {
      const estadoRaw = String(row.get("Estado") ?? "").trim();
      if (normTexto(estadoRaw) !== "cancelado") continue;

      const rf = normalizeFecha(String(row.get("Fecha") ?? ""));
      if (rf !== target) continue;

      const rh = normalizeHora(String(row.get("Hora") ?? "0:0"));
      const volCell = row.get("Volumén") ?? row.get("Volumen") ?? "0";
      const volumen = parseFloat(String(volCell)) || 0;
      if (volumen <= 0) continue;

      cancelledKeys.add(espejoAgendaBloqueoKey(rh, volumen));
    }

    if (cancelledKeys.size === 0) return;

    await reloadSpreadsheetDocInfo();
    const docB = await getSpreadsheetDoc();
    const bloqueosSheet = bloqueosSheetDesdeDoc(docB);
    if (!bloqueosSheet) return;

    await bloqueosSheet.loadHeaderRow();
    const kMotivo = pickBloqueosColumnKey(bloqueosSheet.headerValues, (n) => n === "motivo");
    if (!kMotivo) return;

    const bloqueoRows = await bloqueosSheet.getRows();

    for (const brow of bloqueoRows) {
      const obj = brow.toObject() as Record<string, unknown>;
      let fechaVal: unknown;
      let iniVal: unknown;
      let volVal: unknown;
      let motivoVal: unknown;

      for (const [kk, v] of Object.entries(obj)) {
        const kn = normHeader(kk);
        if (kn === "fecha") fechaVal = fechaVal ?? v;
        else if (kn.includes("hora") && kn.includes("inicio")) iniVal = iniVal ?? v;
        else if (kn.includes("volumen") || /\bvol\b/.test(kn)) volVal = volVal ?? v;
        else if (kn === "motivo") motivoVal = motivoVal ?? v;
      }

      fechaVal = fechaVal ?? brow.get("Fecha" as never);
      iniVal = iniVal ?? brow.get("Hora_Inicio" as never) ?? brow.get("Hora Inicio" as never);
      volVal = volVal ?? brow.get("Volumen_m3" as never) ?? brow.get("Volumen m3" as never) ?? brow.get("Volumen" as never);
      motivoVal = motivoVal ?? brow.get("Motivo" as never);

      const fy = fechaCeldaAgendaAYmd(fechaVal);
      if (!fy || fy !== target) continue;
      if (normTexto(motivoVal) === "cancelado") continue;

      const start = horaCeldaAMinutos(iniVal);
      if (start == null) continue;

      const volumen = valorCeldaANum(volVal);
      if (volumen <= 0) continue;

      const k = espejoAgendaBloqueoKey(mmToHm(start), volumen);
      if (!cancelledKeys.has(k)) continue;

      try {
        brow.set(kMotivo as never, "Cancelado" as never);
        await brow.save();
      } catch (e) {
        console.error("[Bloqueos_Logistica:sync-cancel]", { llave: k, err: e });
      }
    }
  } catch (e) {
    console.error("[Bloqueos_Logistica:sync-cancel] error", e);
  }
}

/**
 * Durante consultas de disponibilidad: si un pedido de Agenda (Fecha del día + Hora + Volumen)
 * no tiene fila equivalente en Bloqueos_Logistica (cascada con Volumen_m3), inserta la fila.
 * Motivo «Ocupado»; Hora_Fin según capacidad m³/h (Config Sistema o 50).
 * Fallos de escritura se registran y no bloquean la lectura de disponibilidad.
 */
export async function ensureAgendaPedidosEspejadosEnBloqueosLogistica(fechaYmd: string): Promise<void> {
  const fecha = normalizeFecha(fechaYmd);
  let baseCap = CAPACIDAD_BASE_M3_HORA;
  try {
    const c = await fetchCapacidadMaximaHora();
    if (Number.isFinite(c) && c > 0) baseCap = c;
  } catch {
    /* 50 m³/h por defecto */
  }

  let pedidos: { hora: string; volumen: number }[];
  let bloqueosDia: BloqueosLogisticaDia;
  try {
    [pedidos, bloqueosDia] = await Promise.all([
      fetchPedidosAgendaOcupanCupoParaDia(fecha),
      fetchBloqueosLogisticaIntervalsForDay(fecha),
    ]);
  } catch (e) {
    console.error("[Bloqueos_Logistica:espejo] error leyendo Agenda o Bloqueos", e);
    return;
  }

  const keysEnBloqueos = new Set(
    bloqueosDia.cascadeOrders.map((c) => espejoAgendaBloqueoKey(c.hora, c.volumen)),
  );

  for (const p of pedidos) {
    const k = espejoAgendaBloqueoKey(p.hora, p.volumen);
    if (keysEnBloqueos.has(k)) continue;

    try {
      await reloadSpreadsheetDocInfo();
      const recheck = await fetchBloqueosLogisticaIntervalsForDay(fecha);
      const recheckKeys = new Set(recheck.cascadeOrders.map((c) => espejoAgendaBloqueoKey(c.hora, c.volumen)));
      if (recheckKeys.has(k)) {
        keysEnBloqueos.add(k);
        continue;
      }

      await appendBloqueoLogisticaOcupacion({
        fecha,
        horaInicio: normalizeHora(p.hora),
        volumenM3: p.volumen,
        capacidadM3PorHora: baseCap,
        motivo: "Ocupado",
      });
      keysEnBloqueos.add(k);
      console.log("[Bloqueos_Logistica:espejo]", JSON.stringify({ accion: "insertado", fecha, llave: k, baseCap }));
    } catch (err) {
      console.error("[Bloqueos_Logistica:espejo] no se pudo insertar fila espejo", { fecha, llave: k, err });
    }
  }
}

function fechaYmdADdMmYyyy(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export interface ReservaPayload {
  Nombre: string;
  Teléfono: string;
  Empresa: string;
  Obra: string;
  Fecha: string;
  Hora: string;
  /** Volumen cotizado (m³) — se escribe en la columna «Volumén» de Agenda (K si el encabezado está en ese orden). */
  Volumen: number;
  /** "Tiro Directo" | "Bombeo - Pluma" | "Bombeo - Estacionaria" — columna Vaciado en Agenda */
  Vaciado: string;
  /** kg/cm² en API; en Agenda se guarda como texto «{kg} N 20 14» para coincidir con la validación de datos. */
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
  Aditivos?: string;
  ResistenciaRapida?: string;
  PrecioM3?: number;
  Desglose?: string;
}

/** Valor de celda en Agenda para «Resistencia f'c» (validación tipo «100 N 20 14» … «350 N 20 14»). */
function resistenciaAgendaSheetDesdeKg(kg: number): string {
  if (!Number.isFinite(kg) || kg <= 0) return String(kg);
  return `${Math.round(kg)} N 20 14`;
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

  const volumenColumnKey: "Volumén" | "Volumen" = sheet.headerValues.includes("Volumén")
    ? "Volumén"
    : "Volumen";

  const row: Record<string, string | number> = {
    Nombre: payload.Nombre,
    Teléfono: payload.Teléfono,
    Empresa: payload.Empresa,
    Obra: payload.Obra,
    Fecha: normalizeFecha(payload.Fecha),
    Hora: normalizeHora(payload.Hora),
    [volumenColumnKey]: payload.Volumen,
    Vaciado: payload.Vaciado,
    "Resistencia f'c": resistenciaAgendaSheetDesdeKg(payload["Resistencia f'c"]),
    Cotización: payload.Cotización,
    Estado: payload.Estado,
    Timestamp_Reserva: payload.Timestamp_Reserva,
    Comentarios: payload.Comentarios,
    Semana: payload.Semana,
  };

  const optionalColumns: Array<[string, string | number | undefined]> = [
    ["Ubicación", payload.UbicacionObra],
    ["Ubicación obra", payload.UbicacionObra],
    ["Ruta Maps", payload.RutaMaps],
    ["Zona", payload.Zona],
    ["Distancia", payload.Distancia],
    ["Duración", payload.Duracion],
    ["Tipo bomba", payload.TipoBomba],
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

/** Encabezados fila 1 de la pestaña «Cotizaciones» (leads del cotizador en modo informativo / sin agenda). */
export const COTIZACIONES_WEB_HEADERS = [
  "Timestamp",
  "Volumen_m3",
  "Resistencia_kg_cm2",
  "Vaciado",
  "Tipo_bomba",
  "Zona",
  "Ubicacion_obra",
  "Ruta_Maps",
  "Distancia",
  "Duracion",
  "Aditivos",
  "Resistencia_rapida",
  "Precio_m3",
  "Total_MXN",
  "Desglose",
] as const;

export interface CotizacionWebLeadPayload {
  Timestamp: string;
  Volumen_m3: number;
  Resistencia_kg_cm2: number;
  Vaciado: string;
  Tipo_bomba: string;
  Zona: string;
  Ubicacion_obra: string;
  Ruta_Maps: string;
  Distancia: string;
  Duracion: string;
  Aditivos: string;
  Resistencia_rapida: string;
  Precio_m3: number;
  Total_MXN: number;
  Desglose: string;
}

/**
 * Garantiza fila 1 con encabezados en «Cotizaciones».
 * Si la hoja es nueva o la fila 1 está vacía, la librería lanzaba «No values in the header row…».
 */
async function ensureCotizacionesWebHeaders(sheet: GoogleSpreadsheetWorksheet): Promise<void> {
  try {
    await sheet.loadHeaderRow();
  } catch {
    /* Primera fila vacía: loadHeaderRow puede fallar según versión de google-spreadsheet. */
  }
  const vals = sheet.headerValues;
  const headersEmpty =
    !vals?.length || vals.every((h) => !String(h ?? "").trim());
  if (headersEmpty) {
    await sheet.setHeaderRow([...COTIZACIONES_WEB_HEADERS]);
    await sheet.loadHeaderRow();
  }
  const missing = COTIZACIONES_WEB_HEADERS.filter((header) => !sheet.headerValues.includes(header));
  if (missing.length > 0) {
    throw new Error(
      `La hoja "Cotizaciones" tiene columnas distintas a las esperadas. Faltan: ${missing.join(
        ", ",
      )}. La fila 1 debe incluir: ${COTIZACIONES_WEB_HEADERS.join(", ")}`,
    );
  }
}

/** Inserta un lead técnico al final de «Cotizaciones» (sin tocar Agenda ni bloqueos). */
export async function appendCotizacionWebLead(payload: CotizacionWebLeadPayload): Promise<void> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Cotizaciones"];
  if (!sheet) {
    throw new Error(
      'No existe la hoja "Cotizaciones". Crea una pestaña con ese nombre en el mismo Google Sheet del proyecto.',
    );
  }
  await ensureCotizacionesWebHeaders(sheet);

  const row: Record<string, string | number> = {};
  for (const key of COTIZACIONES_WEB_HEADERS) {
    row[key] = payload[key as keyof CotizacionWebLeadPayload];
  }

  await sheet.addRow(row, { insert: true });
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

/** Cabeceras mínimas de Agenda. Reportes en Sheets: sumar «Cotización» solo si «Estado» = Pagado y «Semana» coincide (incl. semanas futuras); ver scripts/google-sheets/reportes-total-pagado-por-semana.gs */
const AGENDA_HEADERS = [
  "Nombre",
  "Teléfono",
  "Empresa",
  "Obra",
  "Vaciado",
  "Fecha",
  "Hora",
  "Volumén",
  "Resistencia f'c",
  "Estado",
  "Timestamp_Reserva",
  "Cotización",
  "Comentarios",
  "Semana",
] as const;

async function assertAgendaHeaders(sheet: GoogleSpreadsheetWorksheet): Promise<void> {
  await sheet.loadHeaderRow();
  const headers = sheet.headerValues;
  const missing = AGENDA_HEADERS.filter((header) => {
    if (header === "Volumén") {
      return !headers.includes("Volumén") && !headers.includes("Volumen");
    }
    return !headers.includes(header);
  });
  if (missing.length > 0) {
    throw new Error(`Faltan encabezados en "Agenda": ${missing.join(", ")}`);
  }
}
