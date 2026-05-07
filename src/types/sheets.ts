export interface PrecioRow {
  Resistencia: string;
  Precio_m3: number;
  Cargo_distancia: number;
  Tipo_Vaciado: string;
}

export type ZonaCotizacion = "Z1" | "Z2" | "Z3" | "Z4";

export type ServicioConcreto = "tiro_directo" | "bombeo_estacionaria" | "bombeo_pluma";

export type AditivoCotizacion = "fibra" | "impermeabilizante";

export type ResistenciaRapidaDias = 3 | 7 | 14;

export interface PrecioConcretoPorServicio {
  tiro_directo: number;
  bombeo_estacionaria: number;
  bombeo_pluma: number;
}

export interface ZonaPreciosConcreto {
  preciosPorResistencia: Record<string, PrecioConcretoPorServicio>;
  cargoVacioM3: number;
  serviciosMinimosM3: {
    estacionaria: number;
    pluma: number;
  };
  servicioMinimoImporte: {
    estacionaria: number;
    pluma: number;
  };
}

/** Precios por m³ leídos de la hoja Precios (columna B / campo Precio_m3 por fila). Claves: kg/cm² como string ("100", "150", …). */
export interface CotizacionPreciosConfig {
  resistenciasKg?: number[];
  preciosPorResistencia: Record<string, number>;
  zonas?: Partial<Record<ZonaCotizacion, ZonaPreciosConcreto>>;
  aditivos?: Partial<Record<AditivoCotizacion, number>>;
  resistenciasRapidas?: Partial<Record<ResistenciaRapidaDias, number>>;
  tuberiaExtraTramo10mM3?: number;
  fuente?: "Precios Concreto" | "Precios";
  /** Máx. metros tubería estacionaria cotizable en línea (hoja «Config Sistema»). */
  tuberiaMaximaAutomaticaM?: number;
  /** Máx. m³ cotizables en línea sin asesor (hoja «Config Sistema»). */
  volumenMaximoCotizadorM3?: number;
}
