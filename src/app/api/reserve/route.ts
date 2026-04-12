import {
  appendReservaAgenda,
  fetchCapacidadMaximaHora,
  normalizeHora,
  sumarVolumenAgendado,
} from "@/lib/googleSheets";
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

  if (!nombre || !fecha) {
    return jsonWithCors({ error: "Nombre y fecha son obligatorios" }, 400, METHODS);
  }
  if (!Number.isFinite(volumen) || volumen <= 0) {
    return jsonWithCors({ error: "Volumen debe ser mayor a 0" }, 400, METHODS);
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

    const ts = new Date().toISOString();
    await appendReservaAgenda({
      Nombre: nombre,
      Empresa: empresa,
      Obra: obra || "—",
      Fecha: fecha,
      Hora: hora,
      Volumen: volumen,
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
