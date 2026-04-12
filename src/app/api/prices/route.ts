import { buildCotizacionConfigFromRows } from "@/lib/cotizacion";
import { fetchPreciosRows } from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";

const METHODS = "GET, OPTIONS";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET() {
  try {
    const prices = await fetchPreciosRows();
    const cotizacion = buildCotizacionConfigFromRows(prices);
    return jsonWithCors({ prices, cotizacion }, 200, METHODS);
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al leer precios" },
      500,
      METHODS,
    );
  }
}
