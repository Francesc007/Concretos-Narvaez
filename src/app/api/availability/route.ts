import { NextRequest } from "next/server";
import {
  fetchCapacidadMaximaHora,
  liberarReservasExpiradasAgenda,
  normalizeHora,
  sumarVolumenAgendado,
} from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";
import { validateAgendaSlot } from "@/lib/agendaRules";

const METHODS = "GET, OPTIONS";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET(request: NextRequest) {
  const fecha = request.nextUrl.searchParams.get("fecha") ?? "";
  const horaRaw = request.nextUrl.searchParams.get("hora") ?? "";
  if (!fecha || !horaRaw) {
    return jsonWithCors(
      { error: "Parámetros fecha y hora requeridos" },
      400,
      METHODS,
    );
  }
  try {
    const hora = normalizeHora(horaRaw);
    const horarioError = validateAgendaSlot(fecha, hora);
    if (horarioError) {
      return jsonWithCors(
        {
          error: horarioError,
          fecha,
          hora,
          capacidadMaximaHora: 0,
          usadoM3: 0,
          disponibleM3: 0,
        },
        400,
        METHODS,
      );
    }

    try {
      await liberarReservasExpiradasAgenda();
    } catch (e) {
      console.error("[api/availability] liberarReservasExpiradasAgenda:", e);
    }

    const [capacidadMaximaHora, usadoM3] = await Promise.all([
      fetchCapacidadMaximaHora(),
      sumarVolumenAgendado(fecha, hora),
    ]);
    const disponibleM3 = Math.max(0, capacidadMaximaHora - usadoM3);
    return jsonWithCors(
      {
        fecha,
        hora,
        capacidadMaximaHora,
        usadoM3,
        disponibleM3,
      },
      200,
      METHODS,
    );
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error de disponibilidad" },
      500,
      METHODS,
    );
  }
}
