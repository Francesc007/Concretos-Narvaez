const CDMX_TIME_ZONE = "America/Mexico_City";

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

export function addDaysYmd(ymd: string, days: number) {
  const d = parseYmdLocal(ymd);
  if (!d) return "";
  d.setDate(d.getDate() + days);
  return formatYmdLocal(d);
}

/**
 * Primera fecha de servicio permitida (zona CDMX).
 * - Anticipación mínima aumentada: tres días naturales respecto a hoy, sin contar el domingo como día de servicio.
 * - Excepción: si hoy es viernes, se puede agendar el sábado inmediato (sin obligar a esperar al lunes).
 */
export function earliestCotizacionDateYmd(todayYmd = todayYmdCdmx()) {
  const today = parseYmdLocal(todayYmd);
  if (!today) return "";

  if (today.getDay() === 5 /* viernes */) {
    const sat = addDaysYmd(todayYmd, 1);
    if (parseYmdLocal(sat)?.getDay() === 6 /* sábado */) return sat;
  }

  let candidate = addDaysYmd(todayYmd, 3);
  for (let i = 0; i < 14; i++) {
    if (!isSundayYmd(candidate)) return candidate;
    candidate = addDaysYmd(candidate, 1);
  }
  return addDaysYmd(todayYmd, 3);
}

export function isSundayYmd(ymd: string) {
  return parseYmdLocal(ymd)?.getDay() === 0;
}

export function isAgendaDateAllowed(ymd: string, todayYmd = todayYmdCdmx()) {
  const fecha = parseYmdLocal(ymd);
  if (!fecha) return false;
  if (isSundayYmd(ymd)) return false;
  return ymd >= earliestCotizacionDateYmd(todayYmd);
}

export function lastOrderHourForDate(ymd: string) {
  const day = parseYmdLocal(ymd)?.getDay();
  if (day == null || day === 0) return null;
  return day === 6 ? 12 : 16;
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
  for (let i = 0; i < 14; i++) {
    if (isAgendaDateAllowed(candidate, todayYmd)) return candidate;
    candidate = addDaysYmd(candidate, 1);
  }
  return earliestCotizacionDateYmd(todayYmd);
}

export function validateAgendaSlot(fecha: string, hora: string, todayYmd = todayYmdCdmx()) {
  if (!parseYmdLocal(fecha)) return "Fecha inválida.";
  if (fecha < earliestCotizacionDateYmd(todayYmd)) {
    return "La fecha elegida no cumple la anticipación mínima. Usa la primera fecha disponible en el calendario.";
  }
  if (isSundayYmd(fecha)) return "No laboramos los domingos.";

  const allowedHours = buildAgendaHoursForDate(fecha);
  if (!allowedHours.includes(hora)) {
    return "Horario fuera de servicio. L-V 06:00-16:00 h y sábado 06:00-12:00 h.";
  }
  return null;
}
