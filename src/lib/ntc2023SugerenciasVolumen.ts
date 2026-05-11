/**
 * Sugerencias orientativas de resistencia a la compresión (f'c) para cotización de volumen,
 * alineadas con criterios habituales de las NTC de Concreto (CDMX, lineamiento 2023).
 * No sustituye memoria de cálculo ni proyecto estructural.
 */

export type ElementoVolumenCalculadora =
  | "losa"
  | "piso"
  | "columna"
  | "pared"
  | "cimientos"
  | "trabes";

export type SugerenciaNTCVolumen = {
  /** Nombre del elemento mostrado al usuario */
  elementoEtiqueta: string;
  /**
   * Texto que describe el nivel de resistencia sugerido (sin repetir f'c; va tras «en cuanto a f'c»).
   */
  resistenciaMinimaFc: string;
  /** Referencia normativa breve (NTC vigentes) */
  referenciaNormativa: string;
};

export const SUGERENCIAS_NTC_2023: Record<ElementoVolumenCalculadora, SugerenciaNTCVolumen> = {
  losa: {
    elementoEtiqueta: "Losa",
    resistenciaMinimaFc: "250 kg/cm² por seguridad estructural y durabilidad",
    referenciaNormativa:
      "NTC — Concreto: elementos de piso/cubierta estructural (cap. resistencia, durabilidad y ELS).",
  },
  piso: {
    elementoEtiqueta: "Piso / firme",
    resistenciaMinimaFc: "150/200 kg/cm² según firme de compresión o mayor exigencia del acabado",
    referenciaNormativa:
      "NTC — Concreto: firmes y acabados; el proyectista define exposición y clase de elemento.",
  },
  columna: {
    elementoEtiqueta: "Columna",
    resistenciaMinimaFc: "250 kg/cm² en adelante según confinamiento y solicitaciones (280–300 kg/cm² frecuentes)",
    referenciaNormativa:
      "NTC — Concreto: compresión axial, estribos y detalles sísmicos del proyectista.",
  },
  pared: {
    elementoEtiqueta: "Muro",
    resistenciaMinimaFc: "200 kg/cm² (portante); hasta 250 kg/cm² ante flexión y compresión combinadas",
    referenciaNormativa:
      "NTC — Concreto / sistemas estructurales de muros: revisión por cargas verticales y laterales.",
  },
  cimientos: {
    elementoEtiqueta: "Cimientos",
    resistenciaMinimaFc: "200 kg/cm² en cimentación típica; 250 kg/cm² o más si lo exige el estudio de mecánica de suelos",
    referenciaNormativa:
      "NTC — Concreto: durabilidad en contacto con suelo y cargas de fundación.",
  },
  trabes: {
    elementoEtiqueta: "Trabes y cadenas",
    resistenciaMinimaFc: "200 kg/cm² (cadenas y trabes ligeras); 250 kg/cm² o más en trabes principales",
    referenciaNormativa:
      "NTC — Concreto: flexión, cortante y cadenas de amarre en dirección del proyectista.",
  },
};

export function getSugerenciaVolumenNTC2023(
  elemento: ElementoVolumenCalculadora,
): SugerenciaNTCVolumen {
  return SUGERENCIAS_NTC_2023[elemento];
}

/** Filas para la tabla informativa del modal (valores orientativos de obra en México). */
export const TABLA_RESISTENCIAS_COMUNES: {
  uso: string;
  fc: string;
}[] = [
  { uso: "Relleno o firme de baja solicitud", fc: "100 – 150 kg/cm²" },
  { uso: "Firme de compresión, banqueta o piso ligero", fc: "150 – 200 kg/cm²" },
  { uso: "Muros de carga, cadenas, zapatas comunes", fc: "200 – 250 kg/cm²" },
  { uso: "Losas, columnas y trabes de entramado común", fc: "250 – 300 kg/cm²" },
  { uso: "Elementos de alto desempeño o mayor durabilidad", fc: "≥ 350 kg/cm²" },
];
