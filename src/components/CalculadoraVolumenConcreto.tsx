"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Square,
  Cylinder,
  BrickWall,
  StretchHorizontal,
  Box,
  Info,
  Layers,
  SquareStack,
  X,
} from "lucide-react";
import {
  getSugerenciaVolumenNTC2023,
  TABLA_RESISTENCIAS_COMUNES,
  type ElementoVolumenCalculadora,
} from "@/lib/ntc2023SugerenciasVolumen";

/** Mismo grosor que el resto de iconos (minimal). */
const ICON_STROKE = 1.5 as const;

type Unidad = "m" | "cm" | "ft" | "in";
type Forma = ElementoVolumenCalculadora;
type FormaColumnaSeccion = "rectangular" | "circular";

const UNIDADES: { value: Unidad; label: string }[] = [
  { value: "m", label: "m" },
  { value: "cm", label: "cm" },
  { value: "ft", label: "ft" },
  { value: "in", label: "in" },
];

const FORMAS: {
  id: Forma;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "losa", label: "Losa", icon: Square },
  { id: "piso", label: "Piso / firme", icon: Layers },
  { id: "pared", label: "Muro", icon: BrickWall },
  { id: "columna", label: "Columna", icon: Cylinder },
  { id: "cimientos", label: "Cimientos", icon: StretchHorizontal },
  { id: "trabes", label: "Trabes y cadenas", icon: SquareStack },
];

/** Orden en rejilla 2×3 */
const FORMAS_GRID_ORDER: Forma[] = [
  "losa",
  "piso",
  "pared",
  "columna",
  "cimientos",
  "trabes",
];

function parseNum(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "" || t === "-") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function toMeters(value: number, u: Unidad): number {
  switch (u) {
    case "m":
      return value;
    case "cm":
      return value * 0.01;
    case "ft":
      return value * 0.3048;
    case "in":
      return value * 0.0254;
    default:
      return value;
  }
}

type DimsLosa = { largo: string; ancho: string; espesor: string };
type DimsColumna = {
  seccion: FormaColumnaSeccion;
  diametro: string;
  largo: string;
  ancho: string;
  altura: string;
};
type DimsPared = { longitud: string; espesor: string; altura: string };
type DimsCimientos = { longitud: string; ancho: string; profundidad: string };
type DimsTrabes = { longitud: string; ancho: string; altura: string };

const dimsInicial: {
  losa: DimsLosa;
  piso: DimsLosa;
  columna: DimsColumna;
  pared: DimsPared;
  cimientos: DimsCimientos;
  trabes: DimsTrabes;
} = {
  losa: { largo: "", ancho: "", espesor: "" },
  piso: { largo: "", ancho: "", espesor: "" },
  columna: { seccion: "circular", diametro: "", largo: "", ancho: "", altura: "" },
  pared: { longitud: "", espesor: "", altura: "" },
  cimientos: { longitud: "", ancho: "", profundidad: "" },
  trabes: { longitud: "", ancho: "", altura: "" },
};

function formatM3(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("es-MX", { maximumFractionDigits: 3, minimumFractionDigits: 0 });
}

/** Ejemplo y nota para espesor según unidad (evita confusión m vs cm). */
function ayudaEspesorPorUnidad(u: Unidad): { placeholder: string; nota: string } {
  switch (u) {
    case "m":
      return {
        placeholder: "0.10",
        nota: "En metros (m), escribe el espesor en decimales (ej. 0.10 = 10 cm).",
      };
    case "cm":
      return {
        placeholder: "10",
        nota: "En centímetros (cm), escribe el espesor directo (ej. 10 = 10 cm).",
      };
    case "ft":
      return {
        placeholder: "0.33",
        nota: "En pies (ft), escribe el espesor en decimales (ej. 0.33 ≈ 10 cm).",
      };
    case "in":
      return {
        placeholder: "4",
        nota: "En pulgadas (in), escribe el espesor directo (ej. 4 ≈ 10 cm).",
      };
    default:
      return { placeholder: "0.10", nota: "Usa decimales si la unidad es metros (m)." };
  }
}

function CampoEspesor({
  label,
  value,
  onChange,
  unidad,
  inputClass,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unidad: Unidad;
  inputClass: string;
}) {
  const { placeholder, nota } = ayudaEspesorPorUnidad(unidad);
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <label className="text-xs text-slate-600">{label}</label>
        <span className="text-[11px] leading-snug text-tepexi-accent">{nota}</span>
      </div>
      <input
        className={inputClass}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function etiquetaFormaDetalle(forma: Forma, seccionColumna: FormaColumnaSeccion): string {
  if (forma !== "columna") {
    return FORMAS.find((f) => f.id === forma)?.label ?? forma;
  }
  return seccionColumna === "circular" ? "Columna (sección circular)" : "Columna (sección rectangular)";
}

function TablaResistenciasModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-resistencias-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[min(88vh,28rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3
                id="modal-resistencias-title"
                className="font-display text-lg font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-xl"
              >
                Resistencias <span className="whitespace-nowrap">f&apos;c</span> habituales
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[var(--tepexi-logo-navy)]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" strokeWidth={ICON_STROKE} />
              </button>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-slate-600">
              Valores orientativos de obra en México. El proyectista estructural define{" "}
              <span className="whitespace-nowrap">f&apos;c</span> según cargas, exposición ambiental y
              NTC de Concreto aplicables.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2.5 font-semibold text-[var(--tepexi-logo-navy)]">
                      Uso típico
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-[var(--tepexi-logo-navy)]">
                      <span className="whitespace-nowrap">f&apos;c</span> común
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TABLA_RESISTENCIAS_COMUNES.map((row) => (
                    <tr key={row.uso} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2.5 text-slate-700">{row.uso}</td>
                      <td className="px-3 py-2.5 font-medium tabular-nums text-[var(--tepexi-logo-navy)]">
                        {row.fc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
              Esta tabla es informativa y no reemplaza las Normas Técnicas Complementarias de Diseño de
              Concreto (NTC vigentes en tu jurisdicción).
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface CalculadoraVolumenConcretoProps {
  onCotizarVolumenM3?: (volumenTotalM3: number) => void;
}

export function CalculadoraVolumenConcreto({ onCotizarVolumenM3 }: CalculadoraVolumenConcretoProps) {
  const [forma, setForma] = useState<Forma>("losa");
  const [unidad, setUnidad] = useState<Unidad>("m");
  const [dims, setDims] = useState(dimsInicial);
  const [reservaPct, setReservaPct] = useState("5");
  const [modalResistenciasOpen, setModalResistenciasOpen] = useState(false);

  const cerrarModalResistencias = useCallback(() => setModalResistenciasOpen(false), []);

  const { volumenNetoM3 } = useMemo(() => {
    const u = unidad;
    if (forma === "losa" || forma === "piso") {
      const key = forma === "losa" ? "losa" : "piso";
      const L = parseNum(dims[key].largo);
      const A = parseNum(dims[key].ancho);
      const E = parseNum(dims[key].espesor);
      if (L == null || A == null || E == null || L === 0 || A === 0 || E === 0) {
        return { volumenNetoM3: null as number | null };
      }
      return {
        volumenNetoM3: toMeters(L, u) * toMeters(A, u) * toMeters(E, u),
      };
    }
    if (forma === "columna") {
      const h = parseNum(dims.columna.altura);
      if (h == null || h === 0) {
        return { volumenNetoM3: null };
      }
      if (dims.columna.seccion === "circular") {
        const d = parseNum(dims.columna.diametro);
        if (d == null || d === 0) {
          return { volumenNetoM3: null };
        }
        const r = toMeters(d, u) / 2;
        return {
          volumenNetoM3: Math.PI * r * r * toMeters(h, u),
        };
      }
      const Lb = parseNum(dims.columna.largo);
      const Ab = parseNum(dims.columna.ancho);
      if (Lb == null || Ab == null || Lb === 0 || Ab === 0) {
        return { volumenNetoM3: null };
      }
      return {
        volumenNetoM3: toMeters(Lb, u) * toMeters(Ab, u) * toMeters(h, u),
      };
    }
    if (forma === "pared") {
      const L = parseNum(dims.pared.longitud);
      const t = parseNum(dims.pared.espesor);
      const h = parseNum(dims.pared.altura);
      if (L == null || t == null || h == null || L === 0 || t === 0 || h === 0) {
        return { volumenNetoM3: null };
      }
      return {
        volumenNetoM3: toMeters(L, u) * toMeters(t, u) * toMeters(h, u),
      };
    }
    if (forma === "cimientos") {
      const L = parseNum(dims.cimientos.longitud);
      const A = parseNum(dims.cimientos.ancho);
      const P = parseNum(dims.cimientos.profundidad);
      if (L == null || A == null || P == null || L === 0 || A === 0 || P === 0) {
        return { volumenNetoM3: null };
      }
      return {
        volumenNetoM3: toMeters(L, u) * toMeters(A, u) * toMeters(P, u),
      };
    }
    if (forma === "trabes") {
      const L = parseNum(dims.trabes.longitud);
      const a = parseNum(dims.trabes.ancho);
      const h = parseNum(dims.trabes.altura);
      if (L == null || a == null || h == null || L === 0 || a === 0 || h === 0) {
        return { volumenNetoM3: null };
      }
      return {
        volumenNetoM3: toMeters(L, u) * toMeters(a, u) * toMeters(h, u),
      };
    }
    return { volumenNetoM3: null };
  }, [dims, forma, unidad]);

  const pRes = parseNum(reservaPct) ?? 0;
  const reservaValida = pRes >= 0 && pRes <= 100;
  const extraM3 =
    volumenNetoM3 != null && reservaValida ? (volumenNetoM3 * pRes) / 100 : null;
  const totalM3 =
    volumenNetoM3 != null && reservaValida && extraM3 != null
      ? volumenNetoM3 + extraM3
      : null;

  const sugerenciaNTC = useMemo(() => getSugerenciaVolumenNTC2023(forma), [forma]);

  function setCampoLosa<K extends keyof DimsLosa>(k: K, v: string) {
    setDims((d) => ({ ...d, losa: { ...d.losa, [k]: v } }));
  }
  function setCampoPiso<K extends keyof DimsLosa>(k: K, v: string) {
    setDims((d) => ({ ...d, piso: { ...d.piso, [k]: v } }));
  }
  function setCampoColumna<K extends keyof DimsColumna>(k: K, v: string) {
    setDims((d) => ({ ...d, columna: { ...d.columna, [k]: v } }));
  }
  function setSeccionColumna(seccion: FormaColumnaSeccion) {
    setDims((d) => ({ ...d, columna: { ...d.columna, seccion } }));
  }
  function setCampoPared<K extends keyof DimsPared>(k: K, v: string) {
    setDims((d) => ({ ...d, pared: { ...d.pared, [k]: v } }));
  }
  function setCampoCimientos<K extends keyof DimsCimientos>(k: K, v: string) {
    setDims((d) => ({ ...d, cimientos: { ...d.cimientos, [k]: v } }));
  }
  function setCampoTrabes<K extends keyof DimsTrabes>(k: K, v: string) {
    setDims((d) => ({ ...d, trabes: { ...d.trabes, [k]: v } }));
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20";

  const formaActual = FORMAS.find((f) => f.id === forma) ?? FORMAS[0]!;
  const IconoForma = formaActual.icon;
  const etiquetaDetalle = etiquetaFormaDetalle(forma, dims.columna.seccion);

  return (
    <section
      id="calculadora-volumen"
      className="relative overflow-hidden border-y border-[var(--tepexi-border-light)] bg-[var(--tepexi-section-gray)] py-20 md:py-28"
    >
      <TablaResistenciasModal isOpen={modalResistenciasOpen} onClose={cerrarModalResistencias} />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0v64M0 32h64' stroke='%233d3d3d' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-tepexi-accent/40 bg-tepexi-accent-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-tepexi-accent">
            <Box className="h-3.5 w-3.5" aria-hidden />
            Estima m³ antes de cotizar
          </div>
          <h2 className="font-display mb-4 text-4xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] md:text-5xl">
            Calculadora rápida de metros cúbicos (m³)
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-[var(--tepexi-text-muted)]">
            Cubica tu elemento de concreto con tus medidas de campo y obtén volumen neto más factor de desperdicio—ideal
            para preparar tu solicitud de precio en línea.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="group min-w-0 rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-lg transition-[border-color,box-shadow,ring] duration-300 hover:border-tepexi-accent/45 hover:shadow-md hover:ring-2 hover:ring-tepexi-accent/15 sm:p-6"
          >
            <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-xl">
              <span className="h-1 w-1 rounded-full bg-tepexi-accent" />
              Forma del elemento
            </h3>
            <div
              className="mb-6 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3"
              role="group"
              aria-label="Tipo de forma"
            >
              {FORMAS_GRID_ORDER.map((formaId) => {
                const f = FORMAS.find((x) => x.id === formaId)!;
                const Icon = f.icon;
                const active = forma === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForma(f.id)}
                    className={[
                      "group flex min-h-0 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                      active
                        ? "border-2 border-tepexi-accent bg-tepexi-accent-soft shadow-sm shadow-tepexi-accent/25"
                        : "border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white transition-colors",
                        active
                          ? "border-tepexi-accent/40 text-tepexi-accent"
                          : "border-slate-200 text-slate-500 group-hover:border-slate-300 group-hover:text-[var(--tepexi-logo-navy)]",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-tight text-[var(--tepexi-logo-navy)]">{f.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
              <div className="sm:flex-1">
                <label htmlFor="unidad-global" className="text-xs text-slate-600 block mb-1.5">
                  Unidad de medida
                </label>
                <select
                  id="unidad-global"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value as Unidad)}
                  className={inputClass + " cursor-pointer"}
                >
                  {UNIDADES.map((o) => (
                    <option key={o.value} value={o.value} className="bg-white">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3.5">
              {forma === "losa" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Largo (L)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.losa.largo}
                      onChange={(e) => setCampoLosa("largo", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Ancho (A)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.losa.ancho}
                      onChange={(e) => setCampoLosa("ancho", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <CampoEspesor
                    label="Espesor (E)"
                    value={dims.losa.espesor}
                    onChange={(v) => setCampoLosa("espesor", v)}
                    unidad={unidad}
                    inputClass={inputClass}
                  />
                </>
              )}

              {forma === "piso" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Largo (L)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.piso.largo}
                      onChange={(e) => setCampoPiso("largo", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Ancho (A)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.piso.ancho}
                      onChange={(e) => setCampoPiso("ancho", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <CampoEspesor
                    label="Espesor (firme) (E)"
                    value={dims.piso.espesor}
                    onChange={(v) => setCampoPiso("espesor", v)}
                    unidad={unidad}
                    inputClass={inputClass}
                  />
                </>
              )}

              {forma === "columna" && (
                <>
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Forma de la sección</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Forma de columna">
                      <button
                        type="button"
                        aria-pressed={dims.columna.seccion === "circular"}
                        onClick={() => setSeccionColumna("circular")}
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                          dims.columna.seccion === "circular"
                            ? "border-tepexi-accent bg-tepexi-accent-soft text-tepexi-accent"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        ].join(" ")}
                      >
                        Circular
                      </button>
                      <button
                        type="button"
                        aria-pressed={dims.columna.seccion === "rectangular"}
                        onClick={() => setSeccionColumna("rectangular")}
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                          dims.columna.seccion === "rectangular"
                            ? "border-tepexi-accent bg-tepexi-accent-soft text-tepexi-accent"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        ].join(" ")}
                      >
                        Rectangular
                      </button>
                    </div>
                  </div>
                  {dims.columna.seccion === "circular" ? (
                    <div>
                      <label className="text-xs text-slate-600 block mb-1">Diámetro (D)</label>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={dims.columna.diametro}
                        onChange={(e) => setCampoColumna("diametro", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Lado largo de la sección</label>
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          value={dims.columna.largo}
                          onChange={(e) => setCampoColumna("largo", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Lado corto de la sección</label>
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          value={dims.columna.ancho}
                          onChange={(e) => setCampoColumna("ancho", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Altura (h)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.columna.altura}
                      onChange={(e) => setCampoColumna("altura", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {forma === "pared" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Longitud de la pared</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.pared.longitud}
                      onChange={(e) => setCampoPared("longitud", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <CampoEspesor
                    label="Espesor (t)"
                    value={dims.pared.espesor}
                    onChange={(v) => setCampoPared("espesor", v)}
                    unidad={unidad}
                    inputClass={inputClass}
                  />
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Altura (h)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.pared.altura}
                      onChange={(e) => setCampoPared("altura", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {forma === "cimientos" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Longitud (tramo)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.cimientos.longitud}
                      onChange={(e) => setCampoCimientos("longitud", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Ancho (sección)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.cimientos.ancho}
                      onChange={(e) => setCampoCimientos("ancho", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Profundidad</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.cimientos.profundidad}
                      onChange={(e) => setCampoCimientos("profundidad", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {forma === "trabes" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Longitud del tramo (L)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.trabes.longitud}
                      onChange={(e) => setCampoTrabes("longitud", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Ancho de sección (b)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.trabes.ancho}
                      onChange={(e) => setCampoTrabes("ancho", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Peralte (h)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.trabes.altura}
                      onChange={(e) => setCampoTrabes("altura", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              <div className="pt-1">
                <label htmlFor="reserva-pct" className="text-xs text-slate-600 block mb-1">
                  Volumen de reserva (desperdicio)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    id="reserva-pct"
                    className={inputClass + " sm:max-w-[140px]"}
                    inputMode="decimal"
                    value={reservaPct}
                    onChange={(e) => setReservaPct(e.target.value)}
                    placeholder="0"
                  />
                  <span className="text-sm text-slate-600">%</span>
                </div>
                {!reservaValida && reservaPct.trim() !== "" && (
                  <p className="text-xs text-amber-800 mt-1">Usa un porcentaje entre 0 y 100.</p>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-6 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" aria-hidden />
              Este cálculo es una estimación. Recomendamos validar con nuestros técnicos antes de
              realizar el pedido final.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="min-w-0 lg:sticky lg:top-28"
          >
            <div className="group min-w-0 rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-lg transition-[border-color,box-shadow,ring] duration-300 hover:border-tepexi-accent/45 hover:shadow-md hover:ring-2 hover:ring-tepexi-accent/15 sm:p-8">
              <h3 className="font-display mb-1 flex items-center gap-2 text-lg font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-xl">
                <span className="h-1 w-1 rounded-full bg-tepexi-accent" />
                Detalle del pedido
              </h3>
              <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-tepexi-accent">
                    <IconoForma className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Forma</p>
                    <p className="text-sm font-bold text-[var(--tepexi-logo-navy)] sm:truncate">{etiquetaDetalle}</p>
                  </div>
                </div>
                <p className="shrink-0 text-left text-lg font-bold tabular-nums text-[var(--tepexi-logo-navy)] sm:text-right sm:text-xl">
                  {volumenNetoM3 != null ? formatM3(volumenNetoM3) : "—"}{" "}
                  <span className="text-sm font-semibold text-slate-500">m³</span>
                </p>
              </div>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Volumen neto</dt>
                  <dd className="font-medium tabular-nums text-[var(--tepexi-logo-navy)]">
                    {volumenNetoM3 != null ? `${formatM3(volumenNetoM3)} m³` : "— m³"}
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="min-w-0 break-words text-slate-600">
                    Extra por reserva (
                    {reservaValida ? `${pRes.toLocaleString("es-MX")}` : "—"}%)
                  </dt>
                  <dd className="min-w-0 break-words text-left font-medium text-[var(--tepexi-logo-navy)] tabular-nums sm:text-right">
                    {extraM3 != null ? `${formatM3(extraM3)} m³` : "— m³"}
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col items-start gap-1 border-t border-slate-200 pt-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <dt className="shrink-0 font-semibold text-[var(--tepexi-logo-navy)]">Volumen total</dt>
                  <dd className="w-full min-w-0 break-words font-display text-2xl font-bold text-tepexi-accent tabular-nums sm:w-auto sm:text-right sm:text-3xl">
                    {totalM3 != null ? `${formatM3(totalM3)} m³` : "— m³"}
                  </dd>
                </div>
              </dl>

              <div
                className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-3 text-xs leading-relaxed text-slate-700"
                role="note"
              >
                <p className="font-semibold text-[var(--tepexi-logo-navy)] mb-1.5">Sugerencia técnica</p>
                <p>
                  Sugerencia para{" "}
                  <span className="font-semibold">{sugerenciaNTC.elementoEtiqueta}</span>: resistencia
                  mínima de {sugerenciaNTC.resistenciaMinimaFc} en cuanto a{" "}
                  <span className="whitespace-nowrap">f&apos;c</span>. Basado en las Normas Técnicas
                  Complementarias de Diseño de Concreto.
                </p>
                <p className="mt-2 text-slate-600">{sugerenciaNTC.referenciaNormativa}</p>
                <button
                  type="button"
                  onClick={() => setModalResistenciasOpen(true)}
                  className="mt-2.5 text-left text-xs font-semibold text-tepexi-accent underline decoration-tepexi-accent/40 underline-offset-2 transition-colors hover:text-tepexi-accent-hover hover:decoration-tepexi-accent-hover"
                >
                  Ver tabla comparativa de resistencias (f&apos;c)
                </button>
                <p className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-200/80">
                  Esta sugerencia es informativa; consulte siempre su proyecto estructural.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {onCotizarVolumenM3 && (
                  <button
                    type="button"
                    disabled={totalM3 == null || totalM3 <= 0}
                    onClick={() => onCotizarVolumenM3(totalM3!)}
                    className="w-full font-display flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-tepexi-accent-hover to-tepexi-accent px-5 py-4 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-red-950/25 ring-2 ring-tepexi-accent/20 transition-all hover:scale-[1.01] hover:shadow-xl disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    Cotizar este volumen
                  </button>
                )}
                <p className="text-center text-xs text-slate-500">
                  Resultado en m³. Unidades de entrada convertidas a metros.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
