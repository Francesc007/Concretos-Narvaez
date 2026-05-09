import { NextRequest } from "next/server";
import { computeHorasBloqueadasLogistica } from "@/lib/agendaAvailability";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";

const METHODS = "GET, OPTIONS";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET(request: NextRequest) {
  const fecha = request.nextUrl.searchParams.get("fecha") ?? "";
  if (!fecha) {
    return jsonWithCors({ error: "Parámetro fecha requerido" }, 400, METHODS);
  }
  try {
    const horasBloqueadasLogistica = await computeHorasBloqueadasLogistica(fecha);
    return jsonWithCors({ fecha, horasBloqueadasLogistica }, 200, METHODS);
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al leer bloqueos" },
      500,
      METHODS,
    );
  }
}
