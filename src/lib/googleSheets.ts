/**
 * Solo para entorno servidor (Route Handlers). No importar desde componentes cliente.
 */
import { JWT } from "google-auth-library";
import type { GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
  buildCotizacionConfigFromRows,
  cotizacionTieneAlgunPrecio,
  parseResistenciaKg,
} from "@/lib/cotizacion";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let docSingleton: GoogleSpreadsheet | null = null;

function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  if (!raw) throw new Error("GOOGLE_PRIVATE_KEY no está definida");
  return raw.replace(/\\n/g, "\n");
}

export async function getSpreadsheetDoc(): Promise<GoogleSpreadsheet> {
  if (docSingleton) return docSingleton;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID no está definida");
  if (!email) throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL no está definida");

  const key = getPrivateKey();
  const auth = new JWT({
    email,
    key,
    scopes: SCOPES,
  });

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
    .replace(/\u0300/g, "")
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

async function fetchPreciosDesdeColumnasAB(sheet: GoogleSpreadsheetWorksheet): Promise<PrecioRow[]> {
  const maxR = Math.min(sheet.rowCount || 60, 200);
  if (maxR < 2) return [];
  await sheet.loadCells(`A2:B${maxR}`);
  const out: PrecioRow[] = [];
  for (let r = 2; r <= maxR; r++) {
    const a = sheet.getCellByA1(`A${r}`);
    const b = sheet.getCellByA1(`B${r}`);
    const resistenciaStr = String(a?.value ?? "").trim();
    const precio = parseFloat(String(b?.value ?? "").replace(",", ".")) || 0;
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
  const doc = await getSpreadsheetDoc();
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

  if (!cotizacionTieneAlgunPrecio(buildCotizacionConfigFromRows(mapped))) {
    const desdeAb = await fetchPreciosDesdeColumnasAB(sheet);
    if (desdeAb.length > 0) return desdeAb;
  }
  return mapped;
}

/** Lee capacidad m³/hora: celda B1 (A1 = Capacidad_Maxima_Hora, B1 = 30). */
export async function fetchCapacidadMaximaHora(): Promise<number> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Config"];
  if (!sheet) throw new Error('No existe la hoja "Config"');
  await sheet.loadCells("A1:B1");
  const b1 = sheet.getCellByA1("B1");
  const v = parseFloat(String(b1?.value ?? "30"));
  return Number.isFinite(v) && v > 0 ? v : 30;
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
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
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
  /** 150, 250, 350 o 500 — columna "Resistencia f'c" en Agenda */
  "Resistencia f'c": number;
  /** Total estimado de la cotización (MXN) — columna Cotización */
  Cotización: number;
  Comentarios: string;
  Estado: string;
  Timestamp_Reserva: string;
}

export async function appendReservaAgenda(payload: ReservaPayload): Promise<void> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Agenda"];
  if (!sheet) throw new Error('No existe la hoja "Agenda"');
  await sheet.addRow({
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
  });
}
