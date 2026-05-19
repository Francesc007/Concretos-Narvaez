/**
 * Horarios de visita: Lun–Vie 9:00–16:00 h, Sáb 9:00–12:00 h. Domingo cerrado.
 * Citas de 1 h; último inicio L–V 16:00, sábado 12:00.
 */

import { addDays, format } from "date-fns";

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

/** Primera fecha (desde hoy) con al menos un horario de visita */
export function firstAvailableVisitYmd(): string {
  const start = new Date();
  for (let i = 0; i < 21; i++) {
    const d = addDays(start, i);
    const ymd = format(d, "yyyy-MM-dd");
    if (getHorariosVisita(ymd).length > 0) return ymd;
  }
  return format(start, "yyyy-MM-dd");
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
    "Visita a planta — Concretos Narváez",
    "",
    "Contacto",
    ...(correoLine ? [correoLine] : []),
    `• WhatsApp / Teléfono: ${opts.telefono.trim()}`,
    "",
    `Duración: ${dur} minutos`,
    "Solicitud generada desde el sitio web de Concretos Narváez.",
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
