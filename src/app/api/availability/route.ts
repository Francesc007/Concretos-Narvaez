import { NextRequest } from "next/server";
import { normalizeHora } from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";
import { validateAgendaSlot } from "@/lib/agendaRules";
import { computeAgendaAvailability } from "@/lib/agendaAvailability";

const METHODS = "GET, OPTIONS";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET(request: NextRequest) {
  const fecha = request.nextUrl.searchParams.get("fecha") ?? "";
  const horaRaw = request.nextUrl.searchParams.get("hora") ?? "";
  const volumenRaw = request.nextUrl.searchParams.get("volumen");

  if (!fecha || !horaRaw) {
    return jsonWithCors(
      { error: "Parámetros fecha y hora requeridos" },
      400,
      METHODS,
    );
  }

  const volumenParsed =
    volumenRaw != null && volumenRaw !== "" ? Number.parseFloat(volumenRaw.replace(",", ".")) : Number.NaN;
  const volumen =
    Number.isFinite(volumenParsed) && volumenParsed > 0 ? volumenParsed : undefined;

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
          horasBloqueadasLogistica: [],
          puedeAgendar: false,
          sugerenciaHora: null,
          mensajeCapacidad: horarioError,
        },
        400,
        METHODS,
      );
    }

    const snap = await computeAgendaAvailability({ fecha, hora, volumen });

    return jsonWithCors(
      {
        fecha: snap.fecha,
        hora: snap.hora,
        capacidadMaximaHora: snap.capacidadMaximaHora,
        usadoM3: snap.usadoM3,
        disponibleM3: snap.disponibleM3,
        horasBloqueadasLogistica: snap.horasBloqueadasLogistica,
        puedeAgendar: snap.puedeAgendar,
        sugerenciaHora: snap.sugerenciaHora,
        mensajeCapacidad: snap.mensajeCapacidad,
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
