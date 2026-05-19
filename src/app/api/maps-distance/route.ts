import {
  DISTANCIA_MAXIMA_COTIZACION_KM,
  PLANTA_NARVAEZ_JILOTEPEC,
  labelZona,
  zonaDesdeDistanciaKm,
} from "@/lib/cotizacion";
import { emptyWithCors, jsonWithCors } from "@/lib/api-cors";

export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

interface DistanceMatrixResponse {
  status: string;
  error_message?: string;
  destination_addresses?: string[];
  rows?: Array<{
    elements?: Array<{
      status: string;
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
    }>;
  }>;
}

export async function OPTIONS() {
  return emptyWithCors(204, METHODS);
}

export async function GET(request: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return jsonWithCors({ error: "GOOGLE_MAPS_API_KEY no está definida" }, 500, METHODS);
  }

  const url = new URL(request.url);
  const destino = String(url.searchParams.get("destino") ?? "").trim();
  if (!destino) {
    return jsonWithCors({ error: "Destino requerido" }, 400, METHODS);
  }

  const params = new URLSearchParams({
    origins: `${PLANTA_NARVAEZ_JILOTEPEC.lat},${PLANTA_NARVAEZ_JILOTEPEC.lng}`,
    destinations: destino,
    mode: "driving",
    units: "metric",
    language: "es-MX",
    region: "mx",
    key,
  });

  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as DistanceMatrixResponse;
    const element = data.rows?.[0]?.elements?.[0];
    if (!res.ok || data.status !== "OK" || !element || element.status !== "OK" || !element.distance) {
      return jsonWithCors(
        {
          error:
            data.error_message ||
            "No pudimos calcular la ruta por carretera. Verifica la dirección o contacta a un asesor.",
          googleStatus: data.status,
          elementStatus: element?.status,
        },
        422,
        METHODS,
      );
    }

    const distanceKm = element.distance.value / 1000;
    const durationMin = element.duration ? element.duration.value / 60 : null;
    const zona = zonaDesdeDistanciaKm(distanceKm);
    const bloqueado = distanceKm > DISTANCIA_MAXIMA_COTIZACION_KM || !zona;

    return jsonWithCors(
      {
        destino: data.destination_addresses?.[0] ?? destino,
        distanceKm,
        distanceText: element.distance.text,
        durationMin,
        durationText: element.duration?.text ?? null,
        zona,
        zonaLabel: labelZona(zona),
        bloqueado,
        mensaje: bloqueado
          ? "Tu ubicación requiere logística especial. Por favor, contacta a un asesor para una cotización personalizada."
          : null,
      },
      200,
      METHODS,
    );
  } catch (e) {
    console.error(e);
    return jsonWithCors({ error: "Error al consultar Google Maps" }, 500, METHODS);
  }
}
