export interface PrecioRow {
  Resistencia: string;
  Precio_m3: number;
  Cargo_distancia: number;
  Tipo_Vaciado: string;
}

/** Precios por m³ leídos de la hoja Precios (columna B / campo Precio_m3 por fila). */
export interface CotizacionPreciosConfig {
  preciosPorResistencia: Record<"150" | "250" | "350" | "500", number>;
}
