import {
  appendReservaAgenda,
  fetchCapacidadMaximaHora,
  formatTimestampReservaCDMX,
  liberarReservasExpiradasAgenda,
  normalizeHora,
  semanaIsoDesdeFecha,
  sumarVolumenAgendado,
} from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";
import { validateAgendaSlot } from "@/lib/agendaRules";

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
  metrosTuberia?: number;
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
  if (t === "bombeo_pluma" || t === "bombeo-pluma") return "Bombeo · Bomba Pluma";
  if (t === "bombeo_estacionaria" || t === "bombeoestacionaria") return "Bombeo · Bomba Estacionaria";
  if (t === "bombeo") return "Bombeo";
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
  const horarioError = validateAgendaSlot(fecha, hora);
  if (horarioError) {
    return jsonWithCors({ error: horarioError }, 400, METHODS);
  }

  try {
    try {
      await liberarReservasExpiradasAgenda();
    } catch (e) {
      console.error("[api/reserve] liberarReservasExpiradasAgenda:", e);
    }

    const [capacidad, usado] = await Promise.all([
      fetchCapacidadMaximaHora().catch(() => 50),
      sumarVolumenAgendado(fecha, hora),
    ]);
    if (usado + volumen > capacidad) {
      return jsonWithCors(
        {
          error: "No hay capacidad suficiente en ese horario",
          capacidadMaximaHora: capacidad,
          usadoM3: usado,
          solicitadoM3: volumen,
        },
        409,
        METHODS,
      );
    }

    const ts = formatTimestampReservaCDMX(new Date());
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
      Estado: "Reservado",
      Timestamp_Reserva: ts,
      Comentarios: comentarios,
      Semana: semanaIsoDesdeFecha(fecha),
      UbicacionObra: String(body.ubicacionObra ?? "").trim(),
      RutaMaps: String(body.rutaMaps ?? "").trim(),
      Zona: String(body.zona ?? "").trim(),
      Distancia: String(body.distancia ?? "").trim(),
      Duracion: String(body.duracion ?? "").trim(),
      TipoBomba: String(body.tipoBomba ?? "").trim(),
      MetrosTuberia: Number.isFinite(Number(body.metrosTuberia)) ? Number(body.metrosTuberia) : undefined,
      Aditivos: String(body.aditivos ?? "").trim(),
      ResistenciaRapida: String(body.resistenciaRapida ?? "").trim(),
      PrecioM3: Number.isFinite(Number(body.precioM3)) ? Number(body.precioM3) : undefined,
      Desglose: String(body.desglose ?? "").trim(),
    });

    return jsonWithCors(
      {
        ok: true,
        timestampReserva: ts,
        fecha,
        hora,
        volumen,
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
