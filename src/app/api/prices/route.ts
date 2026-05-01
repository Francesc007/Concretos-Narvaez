import { fetchCotizacionPreciosConfig } from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";

export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET() {
  try {
    const cotizacion = await fetchCotizacionPreciosConfig();
    return jsonWithCors({ prices: [], cotizacion }, 200, METHODS);
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al leer precios" },
      500,
      METHODS,
    );
  }
}
