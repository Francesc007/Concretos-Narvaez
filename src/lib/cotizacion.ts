/**
 * Cotización: resistencias declaradas en RESISTENCIAS_KG con precio por m³ desde la hoja Precios.
 * Se fusionan las filas con encabezados y las columnas A/B; los precios en A/B tienen prioridad por resistencia.
 * Bombeo con volumen &lt; 15 m³: cargo fijo $15,000 MXN.
 */
import type { CotizacionPreciosConfig, PrecioRow } from "@/types/sheets";

/** Subtipo cuando el cliente elige Bombeo (se envía junto al tipo de vaciado). */
export type TipoBombaCotizador = "estacionaria" | "pluma";

export const RESISTENCIAS_KG = [100, 150, 200, 250, 300, 350] as const;
export type ResistenciaKg = (typeof RESISTENCIAS_KG)[number];

/** Cargo fijo bombeo cuando el volumen es menor a 15 m³ */
export const CARGO_BOMBEO_VOL_MENOR_15_M3 = 15000;

const UMBRAL_M3_BOMBEO_EXTRA = 15;

/**
 * Detecta valores de kg/cm² listados en {@link RESISTENCIAS_KG} dentro del texto celda (solo número,
 * o incrustado, p. ej. "250 kg/cm²"). Alternancia ordenada por longitud para que "350" no se confunda
 * dentro de otro número si en el futuro hay más dígitos.
 */
function resistenciasRegexAlternation(): string {
  const alt = [...RESISTENCIAS_KG].map(String).sort((a, b) => b.length - a.length || Number(b) - Number(a));
  return alt.join("|");
}

export function parseResistenciaKg(s: string): ResistenciaKg | null {
  const t = String(s).trim();
  if (t === "") return null;
  const alt = resistenciasRegexAlternation();
  const soloNum = new RegExp(`^(${alt})$`);
  const mExact = soloNum.exec(t);
  if (mExact) return Number(mExact[1]) as ResistenciaKg;
  const embedded = new RegExp(`(?:^|[^0-9])(${alt})(?:[^0-9]|$)`);
  const mEmb = embedded.exec(t);
  if (mEmb) return Number(mEmb[1]) as ResistenciaKg;
  return null;
}

export function labelResistenciaKg(kg: ResistenciaKg): string {
  return `${kg} kg/cm²`;
}

export function buildCotizacionConfigFromRows(rows: PrecioRow[]): CotizacionPreciosConfig {
  const precios: Record<string, number> = {};
  for (const kg of RESISTENCIAS_KG) precios[String(kg)] = 0;
  for (const row of rows) {
    const kg = parseResistenciaKg(row.Resistencia);
    if (kg == null) continue;
    const p = row.Precio_m3;
    if (!Number.isFinite(p) || p <= 0) continue;
    const key = String(kg);
    precios[key] = Math.max(precios[key] ?? 0, p);
  }
  return { preciosPorResistencia: precios };
}

/** Fusiona tabla con encabezados + columnas A/B: el precio en A/B sustituye el de la tabla para esa resistencia; se conservan cargo y tipo de vaciado si ya estaban en la fila de tabla. */
export function mergePreciosRowsPreferColumnasAb(tablaRows: PrecioRow[], columnasAbRows: PrecioRow[]): PrecioRow[] {
  const m = new Map<ResistenciaKg, PrecioRow>();

  for (const row of tablaRows) {
    const kg = parseResistenciaKg(row.Resistencia);
    if (kg == null) continue;
    const p = row.Precio_m3;
    if (!Number.isFinite(p) || p <= 0) continue;
    m.set(kg, {
      Resistencia: labelResistenciaKg(kg),
      Precio_m3: p,
      Cargo_distancia: Number.isFinite(row.Cargo_distancia) ? row.Cargo_distancia : 0,
      Tipo_Vaciado: String(row.Tipo_Vaciado ?? "").trim(),
    });
  }

  for (const row of columnasAbRows) {
    const kg = parseResistenciaKg(row.Resistencia);
    if (kg == null) continue;
    const p = row.Precio_m3;
    if (!Number.isFinite(p) || p <= 0) continue;
    const prev = m.get(kg);
    m.set(kg, {
      Resistencia: labelResistenciaKg(kg),
      Precio_m3: p,
      Cargo_distancia: prev?.Cargo_distancia ?? 0,
      Tipo_Vaciado: prev?.Tipo_Vaciado ?? "",
    });
  }

  return RESISTENCIAS_KG.flatMap((kg) => {
    const r = m.get(kg);
    return r ? [r] : [];
  });
}

export function precioM3ParaResistencia(config: CotizacionPreciosConfig | null, kg: ResistenciaKg): number {
  if (!config) return 0;
  return config.preciosPorResistencia[String(kg)] ?? 0;
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

/** Valor único para el body de `/api/reserve` según tipo de bombeo. */
export function vaciadoApiDesdeSeleccion(
  tipoVaciado: "tiro_directo" | "bombeo",
  tipoBomba: TipoBombaCotizador | undefined,
): "tiro_directo" | "bombeo_estacionaria" | "bombeo_pluma" {
  if (tipoVaciado !== "bombeo") return "tiro_directo";
  return tipoBomba === "pluma" ? "bombeo_pluma" : "bombeo_estacionaria";
}

/** Texto corto para UI / WhatsApp. */
export function labelVaciadoCliente(
  tipoVaciado: "tiro_directo" | "bombeo",
  tipoBomba: TipoBombaCotizador | undefined,
): string {
  if (tipoVaciado !== "bombeo") return "Tiro directo";
  return tipoBomba === "pluma" ? "Bombeo — Bomba Pluma" : "Bombeo — Bomba Estacionaria";
}
