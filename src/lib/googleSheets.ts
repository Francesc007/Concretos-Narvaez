/**
 * Solo para entorno servidor (Route Handlers). No importar desde componentes cliente.
 */
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

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

export async function fetchPreciosRows(): Promise<PrecioRow[]> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Precios"];
  if (!sheet) throw new Error('No existe la hoja "Precios"');
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    Resistencia: String(row.get("Resistencia") ?? "").trim(),
    Precio_m3: parseFloat(String(row.get("Precio_m3") ?? "0")) || 0,
    Cargo_distancia: parseFloat(String(row.get("Cargo_distancia") ?? "0")) || 0,
    Tipo_Vaciado: String(row.get("Tipo_Vaciado") ?? "").trim(),
  }));
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

/** Suma volúmenes en Agenda para fecha+hora con estado Reservado o Confirmado. */
export async function sumarVolumenAgendado(fecha: string, hora: string): Promise<number> {
  const doc = await getSpreadsheetDoc();
  const sheet = doc.sheetsByTitle["Agenda"];
  if (!sheet) throw new Error('No existe la hoja "Agenda"');
  const rows = await sheet.getRows();
  const f = normalizeFecha(fecha);
  const h = normalizeHora(hora);
  let sum = 0;
  for (const row of rows) {
    const estado = String(row.get("Estado") ?? "")
      .trim()
      .toLowerCase();
    if (estado !== "reservado" && estado !== "confirmado") continue;
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
    Estado: payload.Estado,
    Timestamp_Reserva: payload.Timestamp_Reserva,
    Comentarios: payload.Comentarios,
  });
}
