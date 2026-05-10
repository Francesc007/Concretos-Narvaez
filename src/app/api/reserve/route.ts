import {
  appendBloqueoLogisticaOcupacion,
  appendReservaAgenda,
  fetchConfigSistemaCotizacionExtras,
  formatTimestampReservaCDMX,
  normalizeHora,
  semanaIsoDesdeFecha,
} from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";
import { validateAgendaSlot } from "@/lib/agendaRules";
import { loadDayCapacityContext } from "@/lib/agendaAvailability";
import { canScheduleVolume, findNextSuggestedHour } from "@/lib/agendaCapacity";
import { MENSAJE_COTIZACION_ASESOR, VOLUMEN_MAXIMO_COTIZADOR_M3 } from "@/lib/cotizacion";

const METHODS = "POST, OPTIONS";

interface Body {
  nombre?: string;
  telefono?: string;
  empresa?: string;
  obra?: string;
  fecha?: string;
  hora?: string;
  volumen?: number;
  comentarios?: string;
  /** "tiro_directo" | "bombeo" */
  vaciado?: string;
  resistenciaKg?: number;
  cotizacionTotal?: number;
  ubicacionObra?: string;
  rutaMaps?: string;
  zona?: string;
  distancia?: string;
  duracion?: string;
  tipoBomba?: string;
  aditivos?: string;
  resistenciaRapida?: string;
  precioM3?: number;
  desglose?: string;
}

function labelVaciadoAgenda(v: string): string | null {
  const raw = v.trim();
  const t = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0300/g, "")
    .replace(/[\s_]+/g, "_");
  if (t === "tiro_directo" || t === "tirodirecto") return "Tiro Directo";
  // Texto idéntico a las opciones de validación de datos en la columna Vaciado de Agenda.
  if (t === "bombeo_pluma" || t === "bombeo-pluma") return "Bombeo - Pluma";
  if (t === "bombeo_estacionaria" || t === "bombeoestacionaria") return "Bombeo - Estacionaria";
  if (t === "bombeo") return "Bombeo - Estacionaria";
  return null;
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
  const telefono = String(body.telefono ?? "").trim();
  const empresa = String(body.empresa ?? "").trim();
  const obra = String(body.obra ?? "").trim();
  const fecha = String(body.fecha ?? "").trim().slice(0, 10);
  const hora = normalizeHora(String(body.hora ?? "09:00"));
  const volumen = Number(body.volumen);
  const comentarios = String(body.comentarios ?? "").trim();

  const vaciadoLabel = labelVaciadoAgenda(String(body.vaciado ?? ""));
  const resistenciaNum = Number(body.resistenciaKg);
  const cotizacionTotal = Number(body.cotizacionTotal);

  if (!nombre || !fecha) {
    return jsonWithCors({ error: "Nombre y fecha son obligatorios" }, 400, METHODS);
  }
  if (!Number.isFinite(volumen) || volumen <= 0) {
    return jsonWithCors({ error: "Volumen debe ser mayor a 0" }, 400, METHODS);
  }
  if (!vaciadoLabel) {
    return jsonWithCors(
      { error: "Vaciado inválido (usa tiro_directo, bombeo, bombeo_estacionaria o bombeo_pluma)" },
      400,
      METHODS,
    );
  }
  if (!Number.isFinite(resistenciaNum) || resistenciaNum <= 0) {
    return jsonWithCors(
      { error: 'Resistencia inválida. Usa una resistencia configurada en "Precios Concreto".' },
      400,
      METHODS,
    );
  }
  if (!Number.isFinite(cotizacionTotal) || cotizacionTotal < 0) {
    return jsonWithCors({ error: "Cotización total inválida" }, 400, METHODS);
  }

  let volumenMaximoReserva = VOLUMEN_MAXIMO_COTIZADOR_M3;
  try {
    const cfg = await fetchConfigSistemaCotizacionExtras();
    volumenMaximoReserva = cfg.volumenMaximoCotizadorM3;
  } catch {
    /* fallback VOLUMEN_MAXIMO_COTIZADOR_M3 */
  }
  if (volumen > volumenMaximoReserva) {
    return jsonWithCors({ error: MENSAJE_COTIZACION_ASESOR }, 400, METHODS);
  }

  const horarioError = validateAgendaSlot(fecha, hora);
  if (horarioError) {
    return jsonWithCors({ error: horarioError }, 400, METHODS);
  }

  try {
    const { hours, caps, used, baseCap } = await loadDayCapacityContext(fecha);
    if (!canScheduleVolume(used, caps, hours, hora, volumen)) {
      const sugerenciaHora = findNextSuggestedHour(used, caps, hours, volumen);
      return jsonWithCors(
        {
          error: sugerenciaHora
            ? `No hay flujo continuo de capacidad desde ese horario para ${volumen} m³. Prueba ${sugerenciaHora} h.`
            : `No hay capacidad suficiente ese día para ${volumen} m³ con los pedidos y bloqueos actuales.`,
          capacidadMaximaHora: baseCap,
          solicitadoM3: volumen,
          sugerenciaHora,
        },
        409,
        METHODS,
      );
    }

    const ts = formatTimestampReservaCDMX(new Date());

    const { horaFin: horaFinBloqueo, duracionMinutos, bloqueoRow } = await appendBloqueoLogisticaOcupacion({
      fecha,
      horaInicio: hora,
      volumenM3: volumen,
      capacidadM3PorHora: baseCap,
    });

    try {
      await appendReservaAgenda({
        Nombre: nombre,
        Teléfono: telefono,
        Empresa: empresa,
        Obra: obra || "—",
        Fecha: fecha,
        Hora: hora,
        Volumen: volumen,
        Vaciado: vaciadoLabel,
        "Resistencia f'c": resistenciaNum,
        Cotización: cotizacionTotal,
        Estado: "Agendado",
        Timestamp_Reserva: ts,
        Comentarios: comentarios,
        Semana: semanaIsoDesdeFecha(fecha),
        UbicacionObra: String(body.ubicacionObra ?? "").trim(),
        RutaMaps: String(body.rutaMaps ?? "").trim(),
        Zona: String(body.zona ?? "").trim(),
        Distancia: String(body.distancia ?? "").trim(),
        Duracion: String(body.duracion ?? "").trim(),
        TipoBomba: String(body.tipoBomba ?? "").trim(),
        Aditivos: String(body.aditivos ?? "").trim(),
        ResistenciaRapida: String(body.resistenciaRapida ?? "").trim(),
        PrecioM3: Number.isFinite(Number(body.precioM3)) ? Number(body.precioM3) : undefined,
        Desglose: String(body.desglose ?? "").trim(),
      });
    } catch (agendaErr) {
      console.error(
        "[reserve] Falló el guardado en Agenda tras registrar Bloqueos_Logistica; revirtiendo fila de bloqueo",
        agendaErr,
      );
      try {
        await bloqueoRow.delete();
      } catch (delErr) {
        console.error("[reserve] No se pudo eliminar la fila huérfana en Bloqueos_Logistica", delErr);
      }
      throw agendaErr;
    }

    return jsonWithCors(
      {
        ok: true,
        timestampReserva: ts,
        fecha,
        hora,
        volumen,
        bloqueoLogistica: { horaFin: horaFinBloqueo, duracionMinutos },
      },
      201,
      METHODS,
    );
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al guardar reserva" },
      500,
      METHODS,
    );
  }
}
