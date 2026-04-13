import type { CotizacionPreciosConfig } from "@/types/sheets";
import {
  CARGO_BOMBEO_VOL_MENOR_15_M3,
  RESISTENCIAS_KG,
  cargoBombeoAplicable,
  labelResistenciaKg,
  precioM3ParaResistencia,
  type ResistenciaKg,
} from "@/lib/cotizacion";

export interface CotizadorProps {
  cotizacion: CotizacionPreciosConfig | null;
  resistenciaKg: ResistenciaKg;
  setResistenciaKg: (v: ResistenciaKg) => void;
  loading: boolean;
  error: string | null;
  tipoVaciado: "tiro_directo" | "bombeo";
  setTipoVaciado: (v: "tiro_directo" | "bombeo") => void;
  volumen: string;
  setVolumen: (v: string) => void;
  totalEstimado: number;
}

function labelTipoSheet(t: "tiro_directo" | "bombeo") {
  return t === "bombeo" ? "Bombeo" : "Tiro Directo";
}

export function Cotizador({
  cotizacion,
  resistenciaKg,
  setResistenciaKg,
  loading,
  error,
  tipoVaciado,
  setTipoVaciado,
  volumen,
  setVolumen,
  totalEstimado,
}: CotizadorProps) {
  const vol = parseFloat(volumen.replace(",", ".")) || 0;
  const precioM3 = precioM3ParaResistencia(cotizacion, resistenciaKg);
  const bombeoExtra = cargoBombeoAplicable(vol, tipoVaciado);
  const subtotalVol = vol > 0 && precioM3 > 0 ? vol * precioM3 : 0;

  return (
    <div className="space-y-5">
      <h4 className="font-display text-lg font-semibold text-white tracking-wide">Cotización en tiempo real</h4>
      {loading && <p className="text-sm text-[#94a3b8]">Cargando precios desde la tabla…</p>}
      {error && (
        <p className="text-sm text-red-300 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2">{error}</p>
      )}

      <div>
        <label htmlFor="cotiz-resistencia" className="block text-sm font-medium text-[#cbd5e1] mb-2">
          Resistencia f'c
        </label>
        <select
          id="cotiz-resistencia"
          value={resistenciaKg}
          onChange={(e) => setResistenciaKg(Number(e.target.value) as ResistenciaKg)}
          disabled={!cotizacion}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
        >
          {RESISTENCIAS_KG.map((kg) => (
            <option key={kg} value={kg}>
              {labelResistenciaKg(kg)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Tiro directo o bombeo</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTipoVaciado("tiro_directo")}
            className={`flex-1 py-3 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-colors ${
              tipoVaciado === "tiro_directo"
                ? "border-[#c62828] bg-[#c62828]/20 text-white"
                : "border-[#94a3b8]/30 text-[#cbd5e1] hover:bg-white/5"
            }`}
          >
            {labelTipoSheet("tiro_directo")}
          </button>
          <button
            type="button"
            onClick={() => setTipoVaciado("bombeo")}
            className={`flex-1 py-3 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-colors ${
              tipoVaciado === "bombeo"
                ? "border-[#c62828] bg-[#c62828]/20 text-white"
                : "border-[#94a3b8]/30 text-[#cbd5e1] hover:bg-white/5"
            }`}
          >
            {labelTipoSheet("bombeo")}
          </button>
        </div>
        <p className="text-xs text-[#64748b] mt-2">
          Bombeo con volumen menor a 15 m³: se cobra $15,000 MXN.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Volumen (m³)</label>
        <input
          inputMode="decimal"
          value={volumen}
          onChange={(e) => setVolumen(e.target.value)}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
          placeholder="Ej. 12"
        />
      </div>

      <div className="rounded-xl border border-[#78716c]/40 bg-[#0c0f14]/80 px-4 py-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1">Desglose</p>
        {cotizacion && precioM3 > 0 && vol > 0 && (
          <p className="text-sm text-[#cbd5e1]">
            {vol.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m³ ×{" "}
            {precioM3.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ={" "}
            <span className="text-white">${subtotalVol.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </p>
        )}
        {bombeoExtra > 0 && (
          <p className="text-sm text-[#86efac]">
            Cargo bombeo (vol. menor a 15 m³): +$
            {CARGO_BOMBEO_VOL_MENOR_15_M3.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
          </p>
        )}
        <div className="border-t border-[#78716c]/30 pt-2 mt-2">
          <p className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1">Total estimado</p>
          <p className="font-display text-2xl font-bold text-[#ffcdd2]">
            {Number.isFinite(totalEstimado) && totalEstimado > 0
              ? `$${totalEstimado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </p>
        </div>
        <p className="text-xs text-[#64748b]">Revisa y ajusta antes de continuar.</p>
      </div>
    </div>
  );
}
