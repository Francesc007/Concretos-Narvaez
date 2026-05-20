/**
 * Horarios de visita: Lun–Vie 9:00–16:00 h, Sáb 9:00–12:00 h. Domingo cerrado.
 * Citas de 1 h; último inicio L–V 16:00, sábado 12:00.
 */

import { addDays, format } from "date-fns";
import { CONFIG } from "@/config";

export const DURACION_VISITA_MIN = 60;

/** Valores exactos para la columna "Visita" en Sheets y el título del evento en Calendar. */
export type TipoVisitaAgendada = "Obra" | "Planta";

export const TIPOS_VISITA_AGENDADA = ["Obra", "Planta"] as const satisfies readonly TipoVisitaAgendada[];

/** Lista de "HH:mm" disponibles para la fecha local yyyy-MM-dd */
export function getHorariosVisita(fechaYmd: string): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaYmd.trim());
  if (!m) return [];
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return [];
  const dow = dt.getDay();
  if (dow === 0) return [];
  if (dow === 6) {
    return ["09:00", "10:00", "11:00", "12:00"];
  }
  const out: string[] = [];
  for (let h = 9; h <= 16; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
  }
  return out;
}

/** Mañana en yyyy-MM-dd (hora local). No se permiten visitas el mismo día. */
export function earliestVisitDateYmd(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd");
}

/** Primera fecha elegible (desde mañana) con al menos un horario de visita */
export function firstAvailableVisitYmd(): string {
  for (let i = 1; i < 22; i++) {
    const d = addDays(new Date(), i);
    const ymd = format(d, "yyyy-MM-dd");
    if (getHorariosVisita(ymd).length > 0) return ymd;
  }
  return earliestVisitDateYmd();
}

/** Valida fecha de visita: no hoy, no domingo y con horarios disponibles */
export function isVisitDateAllowed(fechaYmd: string): boolean {
  const ymd = fechaYmd.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  if (ymd < earliestVisitDateYmd()) return false;
  return getHorariosVisita(ymd).length > 0;
}

function formatGCalLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}${mo}${day}T${h}${min}${s}`;
}

export interface BuildGoogleCalendarVisitaParams {
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  fechaYmd: string;
  horaHm: string;
  duracionMinutos?: number;
  /** Texto corto de ubicación en el evento */
  ubicacion?: string;
}

/**
 * Abre Google Calendar con evento prellenado (sin API; el usuario confirma en su cuenta).
 * @see https://calendar.google.com/calendar/render?action=TEMPLATE
 */
export function buildGoogleCalendarVisitaUrl(opts: BuildGoogleCalendarVisitaParams): string {
  const dur = opts.duracionMinutos ?? DURACION_VISITA_MIN;
  const parts = opts.fechaYmd.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  const hm = opts.horaHm.split(":").map(Number);
  const hh = hm[0] ?? 8;
  const mm = hm[1] ?? 0;
  const start = new Date(y, mo - 1, d, hh, mm, 0);
  const end = new Date(start.getTime() + dur * 60 * 1000);

  const nombre = opts.nombre.trim();
  const empresa = opts.empresa.trim();
  const titulo = empresa ? `Visita · ${nombre} · ${empresa}` : `Visita · ${nombre}`;

  const correoLine = opts.correo.trim()
    ? `• Correo: ${opts.correo.trim()}`
    : null;
  const details = [
    `Visita a planta — ${CONFIG.companyDisplayName}`,
    "",
    "Contacto",
    ...(correoLine ? [correoLine] : []),
    `• WhatsApp / Teléfono: ${opts.telefono.trim()}`,
    "",
    `Duración: ${dur} minutos`,
    `Solicitud generada desde el sitio web de ${CONFIG.companyDisplayName}.`,
  ].join("\n");

  const location = opts.ubicacion ?? "Jilotepec, Estado de México, México";

  const dates = `${formatGCalLocal(start)}/${formatGCalLocal(end)}`;
  const qs = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(titulo)}`,
    `dates=${dates}`,
    `details=${encodeURIComponent(details)}`,
    `location=${encodeURIComponent(location)}`,
  ].join("&");
  return `https://calendar.google.com/calendar/render?${qs}`;
}
