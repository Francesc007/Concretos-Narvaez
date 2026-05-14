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

/** Solo 3, 7 y 14 son cargo «resistencia rápida»; 28 días es estándar (sin suplemento). */
export function resistenciaRapidaDesdeSeleccion(
  v: "" | ResistenciaRapidaDias | number | null | undefined,
): ResistenciaRapidaDias | null {
  if (v === "" || v == null) return null;
  if (v === 3 || v === 7 || v === 14) return v;
  return null;
}

export const PLANTA_TEPEXI = {
  lat: 19.8419145,
  lng: -99.3477361,
} as const;

export const ZONAS_COTIZACION: Record<ZonaCotizacion, { minKm: number; maxKm: number; label: string }> = {
  Z1: { minKm: 1, maxKm: 10, label: "Zona 1 (1 a 10 km)" },
  Z2: { minKm: 11, maxKm: 20, label: "Zona 2 (11 a 20 km)" },
  Z3: { minKm: 21, maxKm: 30, label: "Zona 3 (21 a 30 km)" },
  Z4: { minKm: 31, maxKm: 40, label: "Zona 4 (31 a 40 km)" },
};

export const DISTANCIA_MAXIMA_COTIZACION_KM = 40;
export const VOLUMEN_MINIMO_OLLA_M3 = 5;
/** Cargo por m³ faltante hasta el mínimo de olla (LDP julio 2025 / nota en PDF). Fallback si la hoja no define el valor. */
export const CARGO_VACIO_REFERENCIA_MXN = 600;
/** Si «Config Sistema» no define máximo de volumen en cotizador, se usa este valor (m³). */
export const VOLUMEN_MAXIMO_COTIZADOR_M3 = 100;

export const MENSAJE_COTIZACION_ASESOR =
  "Por favor, contacta a un asesor para una cotización personalizada.";

/** Mensaje cuando el cliente elige bombeo: el importe de bombeo no se suma en línea. */
export const MENSAJE_INFORMATIVO_BOMBEO_PENDIENTE =
  "Para garantizar la tarifa más competitiva según las necesidades técnicas de tu obra, un asesor integrará el costo de bombeo a tu cotización y te contactará en breve con una propuesta preferencial.";

export function volumenMaximoCotizadorM3(config: CotizacionPreciosConfig | null): number {
  const n = config?.volumenMaximoCotizadorM3;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : VOLUMEN_MAXIMO_COTIZADOR_M3;
}

/**
 * m³ desde el input del cotizador: quita espacios/NBSP para que no se trunque
 * (`parseFloat("5 0")` daría 5). Acepta coma como decimal.
 */
export function volumenM3DesdeCampoTexto(raw: string): number {
  const t = String(raw).trim().replace(/[\s\u00a0\u202f]+/g, "").replace(",", ".");
  const n = parseFloat(t);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Unitario para textos de ayuda; en el total rige el valor configurado por zona en Sheets. */
export function cargoVacioUnitarioMxn(
  config: CotizacionPreciosConfig | null,
  zona: ZonaCotizacion | null | undefined,
): number {
  if (zona) {
    const n = config?.zonas?.[zona]?.cargoVacioM3 ?? 0;
    if (n > 0) return n;
  }
  if (config?.zonas) {
    for (const z of Object.keys(config.zonas) as ZonaCotizacion[]) {
      const n = config.zonas[z]?.cargoVacioM3 ?? 0;
      if (n > 0) return n;
    }
  }
  return CARGO_VACIO_REFERENCIA_MXN;
}

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

/** Texto alineado con las opciones de la columna Vaciado en Agenda (lista desplegable). */
export function labelVaciadoCliente(
  tipoVaciado: "tiro_directo" | "bombeo",
  tipoBomba: TipoBombaCotizador | undefined,
): string {
  if (tipoVaciado !== "bombeo") return "Tiro Directo";
  return tipoBomba === "pluma" ? "Bombeo - Pluma" : "Bombeo - Estacionaria";
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
  if (distanciaKm <= 10) return "Z1";
  if (distanciaKm <= 20) return "Z2";
  if (distanciaKm <= 30) return "Z3";
  if (distanciaKm <= 40) return "Z4";
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
  /** Total refleja solo concreto a precio tiro directo; bombeo lo cotiza un asesor. */
  totalExcluyeBombeo: boolean;
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
  const diasRapidos = resistenciaRapidaDesdeSeleccion(input.resistenciaRapidaDias);
  const volMax = volumenMaximoCotizadorM3(config);
  const esBombeo = input.tipoVaciado === "bombeo";

  let requiereAsesorCotizacion = false;
  if (volumen > volMax) {
    requiereAsesorCotizacion = true;
  }
  if (requiereAsesorCotizacion) {
    motivosBloqueo.push(MENSAJE_COTIZACION_ASESOR);
  }

  if (!config) motivosBloqueo.push("No se pudieron cargar los precios.");
  if (!input.zona) {
    motivosBloqueo.push(
      "Tu ubicación requiere logística especial. Por favor, contacta a un asesor para una cotización personalizada.",
    );
  }

  /** Con bombeo, el subtotal mostrado usa precio de tiro directo (sin rubros automáticos de bombeo). */
  const servicioParaPrecioM3: ServicioConcreto = esBombeo
    ? "tiro_directo"
    : servicioConcretoDesdeSeleccion(input.tipoVaciado, input.tipoBomba);
  const precioM3 = precioM3ZonaServicio(config, input.resistenciaKg, input.zona, servicioParaPrecioM3);
  if (volumen > 0 && precioM3 <= 0) {
    motivosBloqueo.push(
      esBombeo
        ? "No hay precio de concreto (tiro directo) configurado para esta resistencia y zona; necesario para mostrar el subtotal sin bombeo."
        : "No hay precio configurado para la resistencia, zona y servicio seleccionados.",
    );
  }

  const subtotalConcreto = volumen * precioM3;
  if (subtotalConcreto > 0) {
    lineas.push({
      concepto: "Concreto",
      importe: subtotalConcreto,
      detalle: esBombeo
        ? `${volumen.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m³ × $${precioM3.toLocaleString("es-MX", { minimumFractionDigits: 2 })}/m³ (tiro directo; bombeo cotizado aparte por asesor)`
        : `${volumen.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m³ × $${precioM3.toLocaleString("es-MX", { minimumFractionDigits: 2 })}/m³`,
    });
  }

  const cargoVacioUnitario = cargoVacioUnitarioMxn(config, input.zona ?? undefined);
  if (volumen > 0 && volumen < VOLUMEN_MINIMO_OLLA_M3 && subtotalConcreto > 0 && cargoVacioUnitario > 0) {
    const faltante = VOLUMEN_MINIMO_OLLA_M3 - volumen;
    lineas.push({
      concepto: "Cargo por vacío",
      importe: faltante * cargoVacioUnitario,
      detalle: `${faltante.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m³ faltantes × $${cargoVacioUnitario.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN/m³ (mín. olla ${VOLUMEN_MINIMO_OLLA_M3} m³)`,
    });
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

  if (diasRapidos != null) {
    const unitario = importeRapida(config, diasRapidos);
    if (unitario <= 0) {
      motivosBloqueo.push(`Falta configurar el precio de resistencia rápida a ${diasRapidos} días.`);
    } else {
      lineas.push({
        concepto: `Resistencia rápida a ${diasRapidos} días`,
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
    totalExcluyeBombeo: esBombeo,
  };
}
