import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";
import { liberarReservasExpiradasAgenda } from "@/lib/googleSheets";

const METHODS = "GET, OPTIONS";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET() {
  try {
    const result = await liberarReservasExpiradasAgenda();
    return jsonWithCors({ ok: true, ...result }, 200, METHODS);
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al liberar reservas vencidas" },
      500,
      METHODS,
    );
  }
}
