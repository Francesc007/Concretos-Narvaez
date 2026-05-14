import { appendCotizacionWebLead, fetchConfigSistemaCotizacionExtras, formatTimestampReservaCDMX } from "@/lib/googleSheets";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";
import { MENSAJE_COTIZACION_ASESOR, VOLUMEN_MAXIMO_COTIZADOR_M3, volumenM3DesdeCampoTexto } from "@/lib/cotizacion";

const METHODS = "POST, OPTIONS";

interface Body {
  volumen?: number | string;
  vaciado?: string;
  resistenciaKg?: number;
  cotizacionTotal?: number;
  ubicacionObra?: string;
  rutaMaps?: string;
  zona?: string;
  distancia?: string;
  duracion?: string;
  tipoBomba?: string;
  aditivos?: string;
  resistenciaRapida?: string;
  precioM3?: number;
  desglose?: string;
}

function labelVaciadoCotizacion(v: string): string | null {
  const raw = v.trim();
  const t = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0300/g, "")
    .replace(/[\s_]+/g, "_");
  if (t === "tiro_directo" || t === "tirodirecto") return "Tiro Directo";
  if (t === "bombeo_pluma" || t === "bombeo-pluma") return "Bombeo - Pluma";
  if (t === "bombeo_estacionaria" || t === "bombeoestacionaria") return "Bombeo - Estacionaria";
  if (t === "bombeo") return "Bombeo - Estacionaria";
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

  const volumen =
    typeof body.volumen === "number"
      ? body.volumen
      : typeof body.volumen === "string"
        ? volumenM3DesdeCampoTexto(body.volumen)
        : Number(body.volumen);
  const vaciadoLabel = labelVaciadoCotizacion(String(body.vaciado ?? ""));
  const resistenciaNum = Number(body.resistenciaKg);
  const cotizacionTotal = Number(body.cotizacionTotal);
  const precioM3 = Number(body.precioM3);

  if (!Number.isFinite(volumen) || volumen <= 0) {
    return jsonWithCors({ error: "Volumen debe ser mayor a 0" }, 400, METHODS);
  }
  if (!vaciadoLabel) {
    return jsonWithCors(
      { error: "Vaciado inválido (usa tiro_directo, bombeo, bombeo_estacionaria o bombeo_pluma)" },
      400,
      METHODS,
    );
  }
  if (!Number.isFinite(resistenciaNum) || resistenciaNum <= 0) {
    return jsonWithCors({ error: "Resistencia inválida." }, 400, METHODS);
  }
  if (!Number.isFinite(cotizacionTotal) || cotizacionTotal < 0) {
    return jsonWithCors({ error: "Cotización total inválida" }, 400, METHODS);
  }

  let volumenMaximo = VOLUMEN_MAXIMO_COTIZADOR_M3;
  try {
    const cfg = await fetchConfigSistemaCotizacionExtras();
    volumenMaximo = cfg.volumenMaximoCotizadorM3;
  } catch {
    /* fallback */
  }
  if (volumen > volumenMaximo) {
    return jsonWithCors({ error: MENSAJE_COTIZACION_ASESOR }, 400, METHODS);
  }

  const ts = formatTimestampReservaCDMX(new Date());
  const ubicacionObra = String(body.ubicacionObra ?? "").trim();

  try {
    await appendCotizacionWebLead({
      Timestamp: ts,
      Volumen_m3: volumen,
      Resistencia_kg_cm2: resistenciaNum,
      Vaciado: vaciadoLabel,
      Tipo_bomba: String(body.tipoBomba ?? "").trim(),
      Zona: String(body.zona ?? "").trim(),
      Ubicacion_obra: ubicacionObra,
      Ruta_Maps: String(body.rutaMaps ?? "").trim(),
      Distancia: String(body.distancia ?? "").trim(),
      Duracion: String(body.duracion ?? "").trim(),
      Aditivos: String(body.aditivos ?? "").trim(),
      Resistencia_rapida: String(body.resistenciaRapida ?? "").trim(),
      Precio_m3: Number.isFinite(precioM3) ? precioM3 : 0,
      Total_MXN: cotizacionTotal,
      Desglose: String(body.desglose ?? "").trim(),
    });
    return jsonWithCors({ ok: true, timestamp: ts }, 201, METHODS);
  } catch (e) {
    console.error("[cotizacion-lead]", e);
    return jsonWithCors(
      { error: e instanceof Error ? e.message : "Error al guardar cotización" },
      500,
      METHODS,
    );
  }
}
