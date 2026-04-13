import {
  appendReservaAgenda,
  fetchCapacidadMaximaHora,
  formatTimestampReservaCDMX,
  normalizeHora,
  sumarVolumenAgendado,
} from "@/lib/googleSheets";
import { RESISTENCIAS_KG, type ResistenciaKg } from "@/lib/cotizacion";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";

const METHODS = "POST, OPTIONS";

interface Body {
  nombre?: string;
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
}

function labelVaciadoAgenda(v: string): "Tiro Directo" | "Bombeo" | null {
  const t = v.trim().toLowerCase();
  if (t === "tiro_directo" || t === "tiro directo") return "Tiro Directo";
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
    return jsonWithCors({ error: "Vaciado debe ser tiro_directo o bombeo" }, 400, METHODS);
  }
  if (!Number.isFinite(resistenciaNum) || !RESISTENCIAS_KG.includes(resistenciaNum as ResistenciaKg)) {
    return jsonWithCors({ error: "Resistencia debe ser 150, 250, 350 o 500" }, 400, METHODS);
  }
  if (!Number.isFinite(cotizacionTotal) || cotizacionTotal < 0) {
    return jsonWithCors({ error: "Cotización total inválida" }, 400, METHODS);
  }

  try {
    const [capacidad, usado] = await Promise.all([
      fetchCapacidadMaximaHora(),
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
