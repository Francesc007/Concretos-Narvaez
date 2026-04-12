/**
 * Cotización: resistencias 150–500 con precio por m³ desde la hoja Precios (columna B).
 * Bombeo con volumen &lt; 15 m³: cargo fijo $15,000 MXN.
 */
import type { CotizacionPreciosConfig, PrecioRow } from "@/types/sheets";

export const RESISTENCIAS_KG = [150, 250, 350, 500] as const;
export type ResistenciaKg = (typeof RESISTENCIAS_KG)[number];

/** Cargo fijo bombeo cuando el volumen es menor a 15 m³ */
export const CARGO_BOMBEO_VOL_MENOR_15_M3 = 15000;

const UMBRAL_M3_BOMBEO_EXTRA = 15;

/**
 * Detecta 150 / 250 / 350 / 500 en textos como "250 kg/cm²", "250kg", "350" o número puro.
 * Evita falsos positivos tipo "1150" (no coincide el patrón).
 */
export function parseResistenciaKg(s: string): ResistenciaKg | null {
  const t = String(s).trim();
  if (t === "") return null;
  const soloNum = /^(150|250|350|500)$/;
  if (soloNum.test(t)) return Number(t) as ResistenciaKg;
  const m = t.match(/(?:^|[^0-9])(150|250|350|500)(?:[^0-9]|$)/);
  if (m) return Number(m[1]) as ResistenciaKg;
  return null;
}

export function labelResistenciaKg(kg: ResistenciaKg): string {
  return `${kg} kg/cm²`;
}

export function buildCotizacionConfigFromRows(rows: PrecioRow[]): CotizacionPreciosConfig {
  const precios: Record<"150" | "250" | "350" | "500", number> = {
    "150": 0,
    "250": 0,
    "350": 0,
    "500": 0,
  };
  for (const row of rows) {
    const kg = parseResistenciaKg(row.Resistencia);
    if (kg == null) continue;
    const p = row.Precio_m3;
    if (!Number.isFinite(p) || p <= 0) continue;
    const key = String(kg) as keyof typeof precios;
    precios[key] = Math.max(precios[key] ?? 0, p);
  }
  return { preciosPorResistencia: precios };
}

export function precioM3ParaResistencia(config: CotizacionPreciosConfig | null, kg: ResistenciaKg): number {
  if (!config) return 0;
  return config.preciosPorResistencia[String(kg) as "150" | "250" | "350" | "500"] ?? 0;
}

export function cotizacionTieneAlgunPrecio(config: CotizacionPreciosConfig | null): boolean {
  if (!config) return false;
  return RESISTENCIAS_KG.some((kg) => precioM3ParaResistencia(config, kg) > 0);
}

export function calcularTotalCotizacion(
  volumen: number,
  tipoVaciado: "tiro_directo" | "bombeo",
  precioM3: number,
): number {
  if (!Number.isFinite(volumen) || volumen <= 0) return 0;
  if (!Number.isFinite(precioM3) || precioM3 <= 0) return 0;
  const subtotal = volumen * precioM3;
  const extraBombeo =
    tipoVaciado === "bombeo" && volumen < UMBRAL_M3_BOMBEO_EXTRA ? CARGO_BOMBEO_VOL_MENOR_15_M3 : 0;
  return subtotal + extraBombeo;
}

export function cargoBombeoAplicable(volumen: number, tipoVaciado: "tiro_directo" | "bombeo"): number {
  if (tipoVaciado !== "bombeo") return 0;
  if (!Number.isFinite(volumen) || volumen <= 0 || volumen >= UMBRAL_M3_BOMBEO_EXTRA) return 0;
  return CARGO_BOMBEO_VOL_MENOR_15_M3;
}
