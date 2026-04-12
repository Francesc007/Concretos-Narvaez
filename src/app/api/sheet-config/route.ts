import { fetchCapacidadMaximaHora } from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";

const METHODS = "GET, OPTIONS";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET() {
  try {
    const capacidadMaximaHora = await fetchCapacidadMaximaHora();
    return jsonWithCors({ capacidadMaximaHora }, 200, METHODS);
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al leer configuración" },
      500,
      METHODS,
    );
  }
}
