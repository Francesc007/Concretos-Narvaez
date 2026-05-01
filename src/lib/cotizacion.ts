/**
 * Motor de cotización: precios desde Sheets, reglas operativas desde la lista julio 2025.
 */
import type {
  AditivoCotizacion,
  CotizacionPreciosConfig,
  PrecioRow,
  ResistenciaRapidaDias,
  ServicioConcreto,
  ZonaCotizacion,
} from "@/types/sheets";

/** Subtipo cuando el cliente elige Bombeo (se envía junto al tipo de vaciado). */
export type TipoBombaCotizador = "estacionaria" | "pluma";

export const RESISTENCIAS_KG = [100, 150, 200, 250, 300, 350] as const;
export type ResistenciaKg = number;

export const PLANTA_TEPEXI = {
  lat: 19.8419145,
  lng: -99.3477361,
} as const;

export const ZONAS_COTIZACION: Record<ZonaCotizacion, { minKm: number; maxKm: number; label: string }> = {
  Z1: { minKm: 0, maxKm: 20, label: "Zona 1 (0 a 20 km)" },
  Z2: { minKm: 20, maxKm: 30, label: "Zona 2 (21 a 30 km)" },
  Z3: { minKm: 30, maxKm: 40, label: "Zona 3 (31 a 40 km)" },
  Z4: { minKm: 40, maxKm: 50, label: "Zona 4 (41 a 50 km)" },
};

export const DISTANCIA_MAXIMA_COTIZACION_KM = 50;
export const VOLUMEN_MINIMO_OLLA_M3 = 5;
export const TUBERIA_INCLUIDA_M = 30;
export const TUBERIA_MAXIMA_AUTOMATICA_M = 100;

export function parseResistenciaKg(s: string): ResistenciaKg | null {
  const t = String(s).trim();
  if (t === "") return null;
  const m = t.match(/(?:^|[^0-9])(\d{3,4})(?:[^0-9]|$)/);
  if (!m) return null;
  const kg = Number(m[1]);
  if (!Number.isFinite(kg) || kg < 100 || kg > 1000) return null;
  return kg;
}

export function labelResistenciaKg(kg: ResistenciaKg): string {
  return `${kg} kg/cm²`;
}

export function buildCotizacionConfigFromRows(rows: PrecioRow[]): CotizacionPreciosConfig {
  const precios: Record<string, number> = {};
  const resistencias = new Set<number>();
  for (const row of rows) {
    const kg = parseResistenciaKg(row.Resistencia);
    if (kg == null) continue;
    const p = row.Precio_m3;
    if (!Number.isFinite(p) || p <= 0) continue;
    const key = String(kg);
    resistencias.add(kg);
    precios[key] = Math.max(precios[key] ?? 0, p);
  }
  return { resistenciasKg: [...resistencias].sort((a, b) => a - b), preciosPorResistencia: precios, fuente: "Precios" };
}

/** Fusiona tabla con encabezados + columnas A/B: el precio en A/B sustituye el de la tabla para esa resistencia; se conservan cargo y tipo de vaciado si ya estaban en la fila de tabla. */
export function mergePreciosRowsPreferColumnasAb(tablaRows: PrecioRow[], columnasAbRows: PrecioRow[]): PrecioRow[] {
  const m = new Map<number, PrecioRow>();

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

  return [...m.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row);
}

export function precioM3ParaResistencia(config: CotizacionPreciosConfig | null, kg: ResistenciaKg): number {
  if (!config) return 0;
  return config.preciosPorResistencia[String(kg)] ?? 0;
}

export function precioM3ZonaServicio(
  config: CotizacionPreciosConfig | null,
  kg: ResistenciaKg,
  zona: ZonaCotizacion | null,
  servicio: ServicioConcreto,
): number {
  if (!config) return 0;
  if (zona) {
    const precioZona = config.zonas?.[zona]?.preciosPorResistencia[String(kg)]?.[servicio];
    if (Number.isFinite(precioZona) && (precioZona ?? 0) > 0) return precioZona ?? 0;
  }
  return servicio === "tiro_directo" ? precioM3ParaResistencia(config, kg) : 0;
}

export function cotizacionTieneAlgunPrecio(config: CotizacionPreciosConfig | null): boolean {
  if (!config) return false;
  const resistencias = resistenciasCotizacion(config);
  if (resistencias.some((kg) => precioM3ParaResistencia(config, kg) > 0)) return true;
  return resistencias.some((kg) =>
    (Object.keys(ZONAS_COTIZACION) as ZonaCotizacion[]).some((zona) => {
      const precios = config.zonas?.[zona]?.preciosPorResistencia[String(kg)];
      return !!precios && Object.values(precios).some((p) => Number.isFinite(p) && p > 0);
    }),
  );
}

export function resistenciasCotizacion(config: CotizacionPreciosConfig | null): ResistenciaKg[] {
  if (!config) return [...RESISTENCIAS_KG];
  const values = new Set<number>();
  for (const kg of config.resistenciasKg ?? []) {
    if (Number.isFinite(kg) && kg > 0) values.add(kg);
  }
  for (const key of Object.keys(config.preciosPorResistencia)) {
    const kg = Number(key);
    if (Number.isFinite(kg) && kg > 0) values.add(kg);
  }
  for (const zonaConfig of Object.values(config.zonas ?? {})) {
    if (!zonaConfig) continue;
    for (const key of Object.keys(zonaConfig.preciosPorResistencia)) {
      const kg = Number(key);
      if (Number.isFinite(kg) && kg > 0) values.add(kg);
    }
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : [...RESISTENCIAS_KG];
}

export function calcularTotalCotizacion(
  volumen: number,
  tipoVaciado: "tiro_directo" | "bombeo",
  precioM3: number,
): number {
  if (!Number.isFinite(volumen) || volumen <= 0) return 0;
  if (!Number.isFinite(precioM3) || precioM3 <= 0) return 0;
  const subtotal = volumen * precioM3;
  return subtotal;
}

export function cargoBombeoAplicable(volumen: number, tipoVaciado: "tiro_directo" | "bombeo"): number {
  void volumen;
  void tipoVaciado;
  return 0;
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

export function servicioConcretoDesdeSeleccion(
  tipoVaciado: "tiro_directo" | "bombeo",
  tipoBomba: TipoBombaCotizador,
): ServicioConcreto {
  if (tipoVaciado !== "bombeo") return "tiro_directo";
  return tipoBomba === "pluma" ? "bombeo_pluma" : "bombeo_estacionaria";
}

export function zonaDesdeDistanciaKm(distanciaKm: number): ZonaCotizacion | null {
  if (!Number.isFinite(distanciaKm) || distanciaKm < 0) return null;
  if (distanciaKm <= 20) return "Z1";
  if (distanciaKm <= 30) return "Z2";
  if (distanciaKm <= 40) return "Z3";
  if (distanciaKm <= 50) return "Z4";
  return null;
}

export function labelZona(zona: ZonaCotizacion | null): string {
  return zona ? ZONAS_COTIZACION[zona].label : "Fuera de zona automática";
}

export interface CotizacionDinamicaInput {
  volumen: number;
  resistenciaKg: ResistenciaKg;
  tipoVaciado: "tiro_directo" | "bombeo";
  tipoBomba: TipoBombaCotizador;
  zona: ZonaCotizacion | null;
  metrosTuberia: number;
  aditivos: AditivoCotizacion[];
  resistenciaRapidaDias: ResistenciaRapidaDias | null;
}

export interface CotizacionDetalleLinea {
  concepto: string;
  importe: number;
  detalle?: string;
}

export interface CotizacionDinamicaResultado {
  total: number;
  precioM3: number;
  subtotalConcreto: number;
  lineas: CotizacionDetalleLinea[];
  bloqueado: boolean;
  motivosBloqueo: string[];
}

function importeUnitario(config: CotizacionPreciosConfig | null, key: AditivoCotizacion): number {
  return config?.aditivos?.[key] ?? 0;
}

function importeRapida(config: CotizacionPreciosConfig | null, dias: ResistenciaRapidaDias): number {
  return config?.resistenciasRapidas?.[dias] ?? 0;
}

export function calcularCotizacionDinamica(
  config: CotizacionPreciosConfig | null,
  input: CotizacionDinamicaInput,
): CotizacionDinamicaResultado {
  const lineas: CotizacionDetalleLinea[] = [];
  const motivosBloqueo: string[] = [];
  const volumen = Number.isFinite(input.volumen) && input.volumen > 0 ? input.volumen : 0;

  if (!config) motivosBloqueo.push("No se pudieron cargar los precios.");
  if (!input.zona) {
    motivosBloqueo.push(
      "Tu ubicación requiere logística especial. Por favor, contacta a un asesor para una cotización personalizada.",
    );
  }
  if (input.tipoVaciado === "bombeo" && input.tipoBomba === "estacionaria" && input.metrosTuberia > TUBERIA_MAXIMA_AUTOMATICA_M) {
    motivosBloqueo.push("Más de 100 m de tubería requiere validación de un asesor.");
  }
  if (input.resistenciaRapidaDias && input.resistenciaKg < 200) {
    motivosBloqueo.push("Las resistencias rápidas solo aplican a concretos f'c ≥ 200 kg/cm².");
  }

  const servicio = servicioConcretoDesdeSeleccion(input.tipoVaciado, input.tipoBomba);
  const precioM3 = precioM3ZonaServicio(config, input.resistenciaKg, input.zona, servicio);
  if (volumen > 0 && precioM3 <= 0) {
    motivosBloqueo.push("No hay precio configurado para la resistencia, zona y servicio seleccionados.");
  }

  const subtotalConcreto = volumen * precioM3;
  if (subtotalConcreto > 0) {
    lineas.push({
      concepto: "Concreto",
      importe: subtotalConcreto,
      detalle: `${volumen.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m³ × $${precioM3.toLocaleString("es-MX", { minimumFractionDigits: 2 })}/m³`,
    });
  }

  const zonaConfig = input.zona ? config?.zonas?.[input.zona] : undefined;
  const cargoVacioM3 = zonaConfig?.cargoVacioM3 ?? 0;
  if (volumen > 0 && volumen < VOLUMEN_MINIMO_OLLA_M3 && cargoVacioM3 > 0) {
    const faltante = VOLUMEN_MINIMO_OLLA_M3 - volumen;
    lineas.push({
      concepto: "Cargo por vacío",
      importe: faltante * cargoVacioM3,
      detalle: `${faltante.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m³ faltantes para 5 m³`,
    });
  }

  if (input.tipoVaciado === "bombeo" && volumen > 0 && zonaConfig) {
    const tipo = input.tipoBomba;
    const minimoM3 = zonaConfig.serviciosMinimosM3[tipo] || 0;
    const importeMinimo = zonaConfig.servicioMinimoImporte[tipo] || 0;
    const minimoCalculado = minimoM3 > 0 && precioM3 > 0 ? minimoM3 * precioM3 : 0;
    const minimoServicio = Math.max(importeMinimo, minimoCalculado);
    const subtotalActual = volumen * precioM3;
    if (minimoServicio > subtotalActual) {
      lineas.push({
        concepto: "Ajuste servicio mínimo de bombeo",
        importe: minimoServicio - subtotalActual,
        detalle: `${labelVaciadoCliente(input.tipoVaciado, input.tipoBomba)} mínimo ${minimoM3 || "—"} m³`,
      });
    }
  }

  if (input.tipoVaciado === "bombeo" && input.tipoBomba === "estacionaria" && input.metrosTuberia > TUBERIA_INCLUIDA_M) {
    const precioTramo = config?.tuberiaExtraTramo10mM3 ?? 0;
    if (precioTramo > 0 && volumen > 0) {
      const tramosExtra = Math.ceil((input.metrosTuberia - TUBERIA_INCLUIDA_M) / 10);
      lineas.push({
        concepto: "Tubería extra",
        importe: tramosExtra * precioTramo * volumen,
        detalle: `${tramosExtra} tramo(s) de 10 m × $${precioTramo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} × ${volumen.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m³`,
      });
    } else {
      motivosBloqueo.push("Falta configurar el precio de tubería extra en la hoja de precios.");
    }
  }

  for (const aditivo of input.aditivos) {
    const unitario = importeUnitario(config, aditivo);
    if (unitario <= 0) {
      motivosBloqueo.push(`Falta configurar el precio de ${aditivo}.`);
      continue;
    }
    lineas.push({
      concepto: aditivo === "fibra" ? "Fibra de polipropileno" : "Impermeabilizante integral",
      importe: unitario * volumen,
      detalle: `$${unitario.toLocaleString("es-MX", { minimumFractionDigits: 2 })}/m³`,
    });
  }

  if (input.resistenciaRapidaDias) {
    const unitario = importeRapida(config, input.resistenciaRapidaDias);
    if (unitario <= 0) {
      motivosBloqueo.push(`Falta configurar el precio de resistencia rápida a ${input.resistenciaRapidaDias} días.`);
    } else {
      lineas.push({
        concepto: `Resistencia rápida a ${input.resistenciaRapidaDias} días`,
        importe: unitario * volumen,
        detalle: `$${unitario.toLocaleString("es-MX", { minimumFractionDigits: 2 })}/m³`,
      });
    }
  }

  const total = lineas.reduce((sum, item) => sum + item.importe, 0);
  return {
    total,
    precioM3,
    subtotalConcreto,
    lineas,
    bloqueado: motivosBloqueo.length > 0,
    motivosBloqueo,
  };
}
