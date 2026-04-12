import { fetchPreciosRows } from "@/lib/googleSheets";
import { corsHeaders, emptyWithCors, jsonWithCors } from "@/lib/api-cors";

const METHODS = "GET, OPTIONS";

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET() {
  try {
    const prices = await fetchPreciosRows();
    return jsonWithCors({ prices }, 200, METHODS);
  } catch (e) {
    console.error(e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al leer precios" },
      500,
      METHODS,
    );
  }
}
