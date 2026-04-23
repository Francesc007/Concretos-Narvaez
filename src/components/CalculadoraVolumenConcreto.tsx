"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { Square, Cylinder, BrickWall, StretchHorizontal, Box, Info } from "lucide-react";

/** Mismo grosor que el resto de iconos (CEMEX / minimal). */
const ICON_STROKE = 1.5 as const;

type Unidad = "m" | "cm" | "ft" | "in";
type Forma = "losa" | "columna" | "tubo" | "pared" | "cimientos" | "escalera";

function IconEscaleras({
  className,
  strokeWidth: sw = ICON_STROKE,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 20h16" />
      <path d="M4 20v-3.5h4.5V13h4.5V8.5H17V4" />
    </svg>
  );
}

/** Cilindro hueco isométrico: anillo (doble pared) en boca, aristas y arco base. Mismo grosor que Lucide. */
function IconTubo({
  className,
  strokeWidth: sw = ICON_STROKE,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Anillo superior: diámetro exterior e interior (sección 3D) */}
      <ellipse cx="12" cy="5.7" rx="4.8" ry="1.7" />
      <ellipse cx="12" cy="5.7" rx="2.4" ry="0.85" />
      {/* Cara delantera: dos paredes (exterior e interior) */}
      <line x1="7.2" y1="5.6" x2="4.6" y2="14.7" />
      <line x1="9.6" y1="5.65" x2="5.4" y2="14.45" />
      <line x1="14.4" y1="5.65" x2="18.6" y2="14.45" />
      <line x1="16.8" y1="5.6" x2="19.4" y2="14.7" />
      {/* Bordes inferiores: curvas cierre isométrico (cara delantera del aro) */}
      <path d="M4.6 14.7Q12 16.05 19.4 14.7" />
      <path d="M5.4 14.45Q12 15.5 18.6 14.45" />
    </svg>
  );
}

const UNIDADES: { value: Unidad; label: string }[] = [
  { value: "m", label: "m" },
  { value: "cm", label: "cm" },
  { value: "ft", label: "ft" },
  { value: "in", label: "in" },
];

const FORMAS: {
  id: Forma;
  label: string;
  descripcion: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "losa", label: "Losa", descripcion: "Placa rectangular", icon: Square },
  { id: "columna", label: "Columna", descripcion: "Sección circular", icon: Cylinder },
  { id: "tubo", label: "Tubo", descripcion: "Cilindro hueco", icon: IconTubo },
  { id: "pared", label: "Muro", descripcion: "Muro de espesor", icon: BrickWall },
  { id: "cimientos", label: "Cimientos", descripcion: "Cimientos corridos", icon: StretchHorizontal },
  { id: "escalera", label: "Escaleras", descripcion: "Tramo con huella y contrahuella", icon: IconEscaleras },
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
type DimsColumna = { diametro: string; altura: string };
type DimsTubo = { diametroExterior: string; diametroInterior: string; altura: string };
type DimsPared = { longitud: string; espesor: string; altura: string };
type DimsCimientos = { longitud: string; ancho: string; profundidad: string };
/** A: ancho del tramo; H: huella; C: contrahuella; N: escalones. Plataforma base: prisma con mismo ancho A. */
type DimsEscalera = {
  ancho: string;
  huella: string;
  contrahuella: string;
  numEscalones: string;
  plataformaLargo: string;
  plataformaEspesor: string;
};

const dimsInicial: {
  losa: DimsLosa;
  columna: DimsColumna;
  tubo: DimsTubo;
  pared: DimsPared;
  cimientos: DimsCimientos;
  escalera: DimsEscalera;
} = {
  losa: { largo: "", ancho: "", espesor: "" },
  columna: { diametro: "", altura: "" },
  tubo: { diametroExterior: "", diametroInterior: "", altura: "" },
  pared: { longitud: "", espesor: "", altura: "" },
  cimientos: { longitud: "", ancho: "", profundidad: "" },
  escalera: {
    ancho: "",
    huella: "",
    contrahuella: "",
    numEscalones: "",
    plataformaLargo: "",
    plataformaEspesor: "",
  },
};

function formatM3(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("es-MX", { maximumFractionDigits: 3, minimumFractionDigits: 0 });
}

export interface CalculadoraVolumenConcretoProps {
  onCotizarVolumenM3?: (volumenTotalM3: number) => void;
}

export function CalculadoraVolumenConcreto({ onCotizarVolumenM3 }: CalculadoraVolumenConcretoProps) {
  const [forma, setForma] = useState<Forma>("losa");
  const [unidad, setUnidad] = useState<Unidad>("m");
  const [dims, setDims] = useState(dimsInicial);
  const [reservaPct, setReservaPct] = useState("5");

  const { volumenNetoM3, desgloseEscaleraM3 } = useMemo(() => {
    const u = unidad;
    if (forma === "losa") {
      const L = parseNum(dims.losa.largo);
      const A = parseNum(dims.losa.ancho);
      const E = parseNum(dims.losa.espesor);
      if (L == null || A == null || E == null || L === 0 || A === 0 || E === 0) {
        return { volumenNetoM3: null as number | null, desgloseEscaleraM3: null };
      }
      return {
        volumenNetoM3: toMeters(L, u) * toMeters(A, u) * toMeters(E, u),
        desgloseEscaleraM3: null,
      };
    }
    if (forma === "columna") {
      const d = parseNum(dims.columna.diametro);
      const h = parseNum(dims.columna.altura);
      if (d == null || h == null || d === 0 || h === 0) {
        return { volumenNetoM3: null, desgloseEscaleraM3: null };
      }
      const r = toMeters(d, u) / 2;
      return {
        volumenNetoM3: Math.PI * r * r * toMeters(h, u),
        desgloseEscaleraM3: null,
      };
    }
    if (forma === "tubo") {
      const D = parseNum(dims.tubo.diametroExterior);
      const d = parseNum(dims.tubo.diametroInterior);
      const h = parseNum(dims.tubo.altura);
      if (D == null || d == null || h == null || h === 0 || d >= D) {
        return { volumenNetoM3: null, desgloseEscaleraM3: null };
      }
      const R = toMeters(D, u) / 2;
      const r = toMeters(d, u) / 2;
      return {
        volumenNetoM3: (Math.PI * R * R - Math.PI * r * r) * toMeters(h, u),
        desgloseEscaleraM3: null,
      };
    }
    if (forma === "pared") {
      const L = parseNum(dims.pared.longitud);
      const t = parseNum(dims.pared.espesor);
      const h = parseNum(dims.pared.altura);
      if (L == null || t == null || h == null || L === 0 || t === 0 || h === 0) {
        return { volumenNetoM3: null, desgloseEscaleraM3: null };
      }
      return {
        volumenNetoM3: toMeters(L, u) * toMeters(t, u) * toMeters(h, u),
        desgloseEscaleraM3: null,
      };
    }
    if (forma === "cimientos") {
      const L = parseNum(dims.cimientos.longitud);
      const A = parseNum(dims.cimientos.ancho);
      const P = parseNum(dims.cimientos.profundidad);
      if (L == null || A == null || P == null || L === 0 || A === 0 || P === 0) {
        return { volumenNetoM3: null, desgloseEscaleraM3: null };
      }
      return {
        volumenNetoM3: toMeters(L, u) * toMeters(A, u) * toMeters(P, u),
        desgloseEscaleraM3: null,
      };
    }
    if (forma === "escalera") {
      const A = parseNum(dims.escalera.ancho);
      const H = parseNum(dims.escalera.huella);
      const C = parseNum(dims.escalera.contrahuella);
      const nRaw = parseNum(dims.escalera.numEscalones);
      const N = nRaw == null ? null : Math.floor(nRaw);
      if (A == null || H == null || C == null || N == null || N < 1 || A === 0 || H === 0 || C === 0) {
        return { volumenNetoM3: null, desgloseEscaleraM3: null };
      }
      const aM = toMeters(A, u);
      const hM = toMeters(H, u);
      const cM = toMeters(C, u);
      /** N prismas con sección triangular (huella × contrahuella) / 2, longitud = ancho del tramo. */
      const vEscalones = N * (hM * cM * 0.5) * aM;
      const Lb = parseNum(dims.escalera.plataformaLargo);
      const Ep = parseNum(dims.escalera.plataformaEspesor);
      let vPlat = 0;
      if (Lb != null && Ep != null && Lb > 0 && Ep > 0) {
        vPlat = toMeters(Lb, u) * aM * toMeters(Ep, u);
      }
      return {
        volumenNetoM3: vEscalones + vPlat,
        desgloseEscaleraM3: { vEscalones, vPlat, nEscalones: N },
      };
    }
    return { volumenNetoM3: null, desgloseEscaleraM3: null };
  }, [dims, forma, unidad]);

  const pRes = parseNum(reservaPct) ?? 0;
  const reservaValida = pRes >= 0 && pRes <= 100;
  const extraM3 =
    volumenNetoM3 != null && reservaValida ? (volumenNetoM3 * pRes) / 100 : null;
  const totalM3 =
    volumenNetoM3 != null && reservaValida && extraM3 != null
      ? volumenNetoM3 + extraM3
      : null;

  const dIntTubo = parseNum(dims.tubo.diametroInterior);
  const dExtTubo = parseNum(dims.tubo.diametroExterior);
  const avisoTubo = forma === "tubo" && dIntTubo != null && dExtTubo != null && dIntTubo >= dExtTubo;

  function setCampoLosa<K extends keyof DimsLosa>(k: K, v: string) {
    setDims((d) => ({ ...d, losa: { ...d.losa, [k]: v } }));
  }
  function setCampoColumna<K extends keyof DimsColumna>(k: K, v: string) {
    setDims((d) => ({ ...d, columna: { ...d.columna, [k]: v } }));
  }
  function setCampoTubo<K extends keyof DimsTubo>(k: K, v: string) {
    setDims((d) => ({ ...d, tubo: { ...d.tubo, [k]: v } }));
  }
  function setCampoPared<K extends keyof DimsPared>(k: K, v: string) {
    setDims((d) => ({ ...d, pared: { ...d.pared, [k]: v } }));
  }
  function setCampoCimientos<K extends keyof DimsCimientos>(k: K, v: string) {
    setDims((d) => ({ ...d, cimientos: { ...d.cimientos, [k]: v } }));
  }
  function setCampoEscalera<K extends keyof DimsEscalera>(k: K, v: string) {
    setDims((d) => ({ ...d, escalera: { ...d.escalera, [k]: v } }));
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0c0f14] px-3 py-2.5 text-sm text-white placeholder:text-[#64748b] outline-none transition focus:border-[#c62828]/70 focus:ring-2 focus:ring-[#c62828]/20";

  const formaActual = FORMAS.find((f) => f.id === forma) ?? FORMAS[0]!;
  const IconoForma = formaActual.icon;

  return (
    <section
      id="calculadora-volumen"
      className="py-20 md:py-28 bg-[#0c0f14] relative overflow-hidden border-t border-[#78716c]/20"
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0v64M0 32h64' stroke='%23c62828' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c62828]/40 bg-[#c62828]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#fecaca] mb-4">
            <Box className="h-3.5 w-3.5" aria-hidden />
            Herramienta de obra
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            Calculadora de volumen de concreto
          </h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto">
            Selecciona la forma, ingresa medidas y obtén el volumen en metros cúbicos (m³) con reserva
            de desperdicio.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border-2 border-[#78716c]/50 bg-[#141922] p-5 sm:p-6 shadow-xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8] mb-3">
              Forma del elemento
            </p>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6"
              role="group"
              aria-label="Tipo de forma"
            >
              {FORMAS.map((f) => {
                const Icon = f.icon;
                const active = forma === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForma(f.id)}
                    className={[
                      "group flex min-h-[108px] flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-all duration-200",
                      "border shadow-sm",
                      active
                        ? "border-2 border-[#c62828] bg-[#c62828]/[0.12] shadow-[#c62828]/20"
                        : "border border-white/[0.1] bg-[#1a1d24] hover:border-white/20 hover:bg-[#1f2329]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center transition-colors",
                        active ? "text-[#e57373]" : "text-[#94a3b8] group-hover:text-[#cbd5e1]",
                      ].join(" ")}
                    >
                      <Icon
                        className="h-7 w-7"
                        strokeWidth={ICON_STROKE}
                        aria-hidden
                      />
                    </span>
                    <span
                      className={[
                        "text-[13px] font-bold leading-tight",
                        active ? "text-white" : "text-slate-100",
                      ].join(" ")}
                    >
                      {f.label}
                    </span>
                    <span
                      className={[
                        "line-clamp-2 text-[10px] leading-snug sm:text-[11px]",
                        active ? "text-[#cbd5e1]/90" : "text-[#94a3b8]",
                      ].join(" ")}
                    >
                      {f.descripcion}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
              <div className="sm:flex-1">
                <label htmlFor="unidad-global" className="text-xs text-[#94a3b8] block mb-1.5">
                  Unidad de medida
                </label>
                <select
                  id="unidad-global"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value as Unidad)}
                  className={inputClass + " cursor-pointer"}
                >
                  {UNIDADES.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#141922]">
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
                    <label className="text-xs text-[#94a3b8] block mb-1">Largo (L)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.losa.largo}
                      onChange={(e) => setCampoLosa("largo", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Ancho (A)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.losa.ancho}
                      onChange={(e) => setCampoLosa("ancho", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Espesor (E)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.losa.espesor}
                      onChange={(e) => setCampoLosa("espesor", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {forma === "columna" && (
                <>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Diámetro (D)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.columna.diametro}
                      onChange={(e) => setCampoColumna("diametro", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Altura (h)</label>
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

              {forma === "tubo" && (
                <>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Diámetro exterior (D)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.tubo.diametroExterior}
                      onChange={(e) => setCampoTubo("diametroExterior", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Diámetro interior (d)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.tubo.diametroInterior}
                      onChange={(e) => setCampoTubo("diametroInterior", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Altura (h)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.tubo.altura}
                      onChange={(e) => setCampoTubo("altura", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {forma === "pared" && (
                <>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Longitud de la pared</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.pared.longitud}
                      onChange={(e) => setCampoPared("longitud", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Espesor (t)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.pared.espesor}
                      onChange={(e) => setCampoPared("espesor", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Altura (h)</label>
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
                    <label className="text-xs text-[#94a3b8] block mb-1">Longitud (tramo)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.cimientos.longitud}
                      onChange={(e) => setCampoCimientos("longitud", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Ancho (sección)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.cimientos.ancho}
                      onChange={(e) => setCampoCimientos("ancho", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Profundidad</label>
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

              {forma === "escalera" && (
                <>
                  <p className="text-xs text-[#94a3b8] -mt-1 mb-1 leading-relaxed">
                    Modelo: por cada peldaño, prisma con sección triangular (huella × contrahuella) / 2 y longitud
                    igual al ancho. Opcional: plataforma de arranque como losa.
                  </p>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Ancho del tramo (A)</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.escalera.ancho}
                      onChange={(e) => setCampoEscalera("ancho", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white font-medium block mb-1">Huella (H) — avance horizontal</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.escalera.huella}
                      onChange={(e) => setCampoEscalera("huella", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white font-medium block mb-1">
                      Contrahuella (C) — altura vertical
                    </label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={dims.escalera.contrahuella}
                      onChange={(e) => setCampoEscalera("contrahuella", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1">Número de escalones (N)</label>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={dims.escalera.numEscalones}
                      onChange={(e) => setCampoEscalera("numEscalones", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-[#64748b] pt-1">
                    Plataforma de arranque (opcional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-1">Largo de la plataforma</label>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={dims.escalera.plataformaLargo}
                        onChange={(e) => setCampoEscalera("plataformaLargo", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-1">Espesor / profundidad</label>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={dims.escalera.plataformaEspesor}
                        onChange={(e) => setCampoEscalera("plataformaEspesor", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-1">
                <label htmlFor="reserva-pct" className="text-xs text-[#94a3b8] block mb-1">
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
                  <span className="text-sm text-[#94a3b8]">%</span>
                </div>
                {!reservaValida && reservaPct.trim() !== "" && (
                  <p className="text-xs text-amber-400/90 mt-1">Usa un porcentaje entre 0 y 100.</p>
                )}
              </div>
            </div>

            {avisoTubo && (
              <p className="text-xs text-amber-400/90 mt-3 flex items-start gap-1.5">
                <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                El diámetro interior debe ser menor que el exterior para un tubo válido.
              </p>
            )}

            <p className="text-xs text-[#64748b] leading-relaxed mt-6 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-[#78716c]" aria-hidden />
              Este cálculo es una estimación. Recomendamos validar con nuestros técnicos antes de
              realizar el pedido final.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="lg:sticky lg:top-28"
          >
            <div className="rounded-2xl border-2 border-[#c62828]/35 bg-gradient-to-b from-[#1a1f2e] to-[#141922] p-6 sm:p-8 shadow-2xl shadow-black/30">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-wide mb-1 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#c62828]" />
                Detalle del pedido
              </h3>
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c0f14]/60 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#141922] text-[#e57373]">
                    <IconoForma className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">Forma</p>
                    <p className="truncate text-sm font-bold text-white">{formaActual.label}</p>
                  </div>
                </div>
                <p className="shrink-0 text-right text-lg font-bold tabular-nums text-white sm:text-xl">
                  {volumenNetoM3 != null && !avisoTubo ? formatM3(volumenNetoM3) : "—"}{" "}
                  <span className="text-sm font-semibold text-[#94a3b8]">m³</span>
                </p>
              </div>
              {desgloseEscaleraM3 && (
                <div className="mb-4 space-y-1.5 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5 text-xs">
                  <p className="text-[#94a3b8]">Desglose (estimado)</p>
                  <div className="flex justify-between gap-2 text-[#cbd5e1]">
                    <span>Peldaños (N = {desgloseEscaleraM3.nEscalones})</span>
                    <span className="tabular-nums text-white">
                      {formatM3(desgloseEscaleraM3.vEscalones)} m³
                    </span>
                  </div>
                  {desgloseEscaleraM3.vPlat > 0 && (
                    <div className="flex justify-between gap-2 text-[#cbd5e1]">
                      <span>Plataforma de arranque</span>
                      <span className="tabular-nums text-white">
                        {formatM3(desgloseEscaleraM3.vPlat)} m³
                      </span>
                    </div>
                  )}
                </div>
              )}
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#94a3b8]">Volumen neto</dt>
                  <dd className="text-white font-medium tabular-nums">
                    {volumenNetoM3 != null && !avisoTubo
                      ? `${formatM3(volumenNetoM3)} m³`
                      : "— m³"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#94a3b8]">
                    Extra por reserva (
                    {reservaValida ? `${pRes.toLocaleString("es-MX")}` : "—"}%)
                  </dt>
                  <dd className="text-white font-medium tabular-nums">
                    {extraM3 != null && !avisoTubo
                      ? `${formatM3(extraM3)} m³`
                      : "— m³"}
                  </dd>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between gap-4 items-baseline">
                  <dt className="text-[#e2e8f0] font-semibold">Volumen total</dt>
                  <dd className="text-2xl sm:text-3xl font-bold text-white font-display tabular-nums">
                    {totalM3 != null && !avisoTubo
                      ? `${formatM3(totalM3)} m³`
                      : "— m³"}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 space-y-3">
                {onCotizarVolumenM3 && (
                  <button
                    type="button"
                    disabled={totalM3 == null || totalM3 <= 0}
                    onClick={() => onCotizarVolumenM3(totalM3!)}
                    className="w-full font-display flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e53935] to-[#c62828] px-5 py-4 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-red-900/40 ring-2 ring-white/20 transition-all hover:scale-[1.01] hover:shadow-xl disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    Cotizar este volumen
                  </button>
                )}
                <p className="text-center text-xs text-[#64748b]">
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
