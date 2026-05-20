import {
  TIPOS_VISITA_AGENDADA,
  getHorariosVisita,
  isVisitDateAllowed,
  type TipoVisitaAgendada,
} from "@/lib/agendaVisita";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";
import { createVisitaAgendadaCalendarEvent } from "@/lib/googleCalendar";
import { appendVisitaAgendadaRow, normalizeHora } from "@/lib/googleSheets";

const METHODS = "POST, OPTIONS";

export const dynamic = "force-dynamic";

function isTipoVisita(t: string): t is TipoVisitaAgendada {
  return (TIPOS_VISITA_AGENDADA as readonly string[]).includes(t);
}

interface Body {
  nombre?: string;
  empresa?: string;
  correo?: string;
  telefono?: string;
  fecha?: string;
  horario?: string;
  visita?: string;
}

function emailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonWithCors({ error: "JSON inválido" }, 400, METHODS);
  }

  const nombre = String(body.nombre ?? "").trim();
  const empresa = String(body.empresa ?? "").trim();
  const correo = String(body.correo ?? "").trim();
  const telefono = String(body.telefono ?? "").trim();
  const fecha = String(body.fecha ?? "").trim().slice(0, 10);
  const horario = normalizeHora(String(body.horario ?? ""));
  const visitaRaw = String(body.visita ?? "").trim();

  if (nombre.length < 2) {
    return jsonWithCors({ error: "El nombre debe tener al menos 2 caracteres" }, 400, METHODS);
  }
  if (correo && !emailOk(correo)) {
    return jsonWithCors({ error: "Correo electrónico inválido" }, 400, METHODS);
  }
  if (telefono.length < 8) {
    return jsonWithCors({ error: "Teléfono / WhatsApp inválido (mínimo 8 caracteres)" }, 400, METHODS);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return jsonWithCors({ error: "Fecha inválida" }, 400, METHODS);
  }
  if (!isVisitDateAllowed(fecha)) {
    return jsonWithCors(
      { error: "La visita debe agendarse a partir de mañana (no el mismo día ni domingo)" },
      400,
      METHODS,
    );
  }
  const slots = getHorariosVisita(fecha);
  if (!slots.includes(horario)) {
    return jsonWithCors({ error: "Horario no disponible" }, 400, METHODS);
  }
  if (!isTipoVisita(visitaRaw)) {
    return jsonWithCors({ error: "Visita debe ser Obra o Planta" }, 400, METHODS);
  }
  const tipoVisita: TipoVisitaAgendada = visitaRaw;

  try {
    await appendVisitaAgendadaRow({
      Nombre: nombre,
      Empresa: empresa,
      Correo: correo,
      Telefono: telefono,
      Fecha: fecha,
      Horario: horario,
      Visita: tipoVisita,
    });

    const cal = await createVisitaAgendadaCalendarEvent({
      tipoVisita,
      nombre,
      empresa,
      correo,
      telefono,
      fechaYmd: fecha,
      horaHm: horario,
    });

    return jsonWithCors(
      { ok: true, eventId: cal.id ?? undefined, eventLink: cal.htmlLink ?? undefined },
      201,
      METHODS,
    );
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al guardar la visita" },
      500,
      METHODS,
    );
  }
}
