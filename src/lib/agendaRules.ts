const CDMX_TIME_ZONE = "America/Mexico_City";

/**
 * Días naturales a sumar a “hoy” (CDMX) para la primera fecha de servicio habitual.
 * Ej.: lunes + 3 = jueves → se bloquean para servicio el martes y el miércoles (2 días “de por medio”).
 */
const DIAS_ANTICIPACION_PRIMERA_FECHA = 3;

/** Si hoy es viernes, +3 cae en lunes (demasiado pronto para la operación); se usa +4 (martes). */
const DIAS_ANTICIPACION_DESDE_VIERNES = 4;

function parseYmdParts(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

export function parseYmdLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export function formatYmdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayYmdCdmx(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CDMX_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

/** Día de la semana 0=dom … 6=sáb para la fecha civil yyyy-MM-dd (independiente del huso del navegador). */
export function civilWeekdayFromYmd(ymd: string): number | null {
  const p = parseYmdParts(ymd);
  if (!p) return null;
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

/** Suma días al calendario civil yyyy-MM-dd (UTC). */
export function addDaysYmd(ymd: string, days: number) {
  const p = parseYmdParts(ymd);
  if (!p) return "";
  const u = Date.UTC(p.y, p.m - 1, p.d) + days * 86400000;
  const x = new Date(u);
  const y = x.getUTCFullYear();
  const mo = String(x.getUTCMonth() + 1).padStart(2, "0");
  const d = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/**
 * Primera fecha de servicio permitida (regla operativa CDMX).
 * - No se agenda “de un día para otro”: hay **2 días naturales bloqueados** después de hoy (típico lunes → primera fecha jueves).
 * - **Viernes:** sin servicio al sábado siguiente ni al lunes inmediato; la primera fecha suele ser **martes** (+4 días naturales).
 * - Domingo nunca es día de servicio en el cotizador.
 */
export function earliestCotizacionDateYmd(todayYmd = todayYmdCdmx()) {
  if (!parseYmdParts(todayYmd)) return "";

  const desplazamiento =
    civilWeekdayFromYmd(todayYmd) === 5 ? DIAS_ANTICIPACION_DESDE_VIERNES : DIAS_ANTICIPACION_PRIMERA_FECHA;

  let candidate = addDaysYmd(todayYmd, desplazamiento);
  for (let i = 0; i < 14; i++) {
    if (!isSundayYmd(candidate)) return candidate;
    candidate = addDaysYmd(candidate, 1);
  }
  return addDaysYmd(todayYmd, desplazamiento);
}

export function isSundayYmd(ymd: string) {
  return civilWeekdayFromYmd(ymd) === 0;
}

export function isAgendaDateAllowed(ymd: string, todayYmd = todayYmdCdmx()) {
  if (!parseYmdParts(ymd)) return false;
  if (isSundayYmd(ymd)) return false;
  const earliest = earliestCotizacionDateYmd(todayYmd);
  if (!earliest) return false;
  return ymd >= earliest;
}

export function lastOrderHourForDate(ymd: string) {
  const wd = civilWeekdayFromYmd(ymd);
  if (wd == null || wd === 0) return null;
  return wd === 6 ? 12 : 16;
}

export function buildAgendaHoursForDate(ymd: string) {
  const last = lastOrderHourForDate(ymd);
  if (last == null) return [];

  const out: string[] = [];
  for (let h = 6; h <= last; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
  }
  return out;
}

export function nextAllowedAgendaDateYmd(todayYmd = todayYmdCdmx()) {
  let candidate = earliestCotizacionDateYmd(todayYmd);
  if (!candidate) return todayYmd;
  for (let i = 0; i < 14; i++) {
    if (isAgendaDateAllowed(candidate, todayYmd)) return candidate;
    candidate = addDaysYmd(candidate, 1);
  }
  return earliestCotizacionDateYmd(todayYmd) || todayYmd;
}

export function validateAgendaSlot(fecha: string, hora: string, todayYmd = todayYmdCdmx()) {
  if (!parseYmdParts(fecha)) return "Fecha inválida.";
  const earliest = earliestCotizacionDateYmd(todayYmd);
  if (!earliest || fecha < earliest) {
    return "La fecha elegida no cumple la anticipación mínima. Usa la primera fecha disponible en el calendario.";
  }
  if (isSundayYmd(fecha)) return "No laboramos los domingos.";

  const allowedHours = buildAgendaHoursForDate(fecha);
  if (!allowedHours.includes(hora)) {
    return "Horario fuera de servicio. L-V 06:00-16:00 h y sábado 06:00-12:00 h.";
  }
  return null;
}
