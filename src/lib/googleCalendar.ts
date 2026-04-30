/**
 * Solo servidor. Crea eventos con la cuenta de servicio (calendario compartido con GOOGLE_CALENDAR_ID).
 */
import { google } from "googleapis";
import type { TipoVisitaAgendada } from "@/lib/agendaVisita";
import { getGoogleServiceAccountJwt, normalizeFecha, normalizeHora } from "@/lib/googleSheets";

const TZ = "America/Mexico_City";

/** Suma 1 h a fecha+hora civil (sin TZ); coherente con start/end + timeZone en Calendar API. */
function addOneHourToDateTimeYmd(fechaYmd: string, horaHm: string): string {
  const [y0, mo0, d0] = fechaYmd.split("-").map(Number);
  const [h0, mi0] = horaHm.split(":").map(Number);
  let y = y0;
  let mo = mo0;
  let d = d0;
  let h = h0;
  const mi = mi0;
  h += 1;
  if (h >= 24) {
    h -= 24;
    d += 1;
    const dim = new Date(y, mo, 0).getDate();
    if (d > dim) {
      d = 1;
      mo += 1;
      if (mo > 12) {
        mo = 1;
        y += 1;
      }
    }
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:00`;
}

export async function createVisitaAgendadaCalendarEvent(opts: {
  tipoVisita: TipoVisitaAgendada;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  fechaYmd: string;
  horaHm: string;
}): Promise<{ htmlLink?: string | null; id?: string | null }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID no está definida");

  const empresa = opts.empresa.trim();
  const nombre = opts.nombre.trim();
  const titulo = empresa
    ? `Visita ${opts.tipoVisita}: ${nombre} - ${empresa}`
    : `Visita ${opts.tipoVisita}: ${nombre}`;

  const fecha = normalizeFecha(opts.fechaYmd);
  const hm = normalizeHora(opts.horaHm);
  const [hh, mm] = hm.split(":");
  const startDateTime = `${fecha}T${hh}:${mm}:00`;
  const endDateTime = addOneHourToDateTimeYmd(fecha, `${hh}:${mm}`);

  const auth = getGoogleServiceAccountJwt();
  const calendar = google.calendar({ version: "v3", auth });

  const description = [
    `Visita: ${opts.tipoVisita}`,
    empresa ? `Empresa: ${empresa}` : null,
    opts.correo.trim() ? `Correo: ${opts.correo.trim()}` : null,
    `Teléfono / WhatsApp: ${opts.telefono.trim()}`,
    "",
    "Registrado desde la landing de Concretos Tepexi.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: titulo,
      description,
      start: { dateTime: startDateTime, timeZone: TZ },
      end: { dateTime: endDateTime, timeZone: TZ },
    },
  });

  return { htmlLink: res.data.htmlLink, id: res.data.id };
}
