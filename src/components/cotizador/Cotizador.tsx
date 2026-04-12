import type { PrecioRow } from "@/types/sheets";

export interface CotizadorProps {
  precios: PrecioRow[];
  loading: boolean;
  error: string | null;
  resistencia: string;
  setResistencia: (v: string) => void;
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
  precios,
  loading,
  error,
  resistencia,
  setResistencia,
  tipoVaciado,
  setTipoVaciado,
  volumen,
  setVolumen,
  totalEstimado,
}: CotizadorProps) {
  const resistencias = [...new Set(precios.map((p) => p.Resistencia).filter(Boolean))];

  return (
    <div className="space-y-5">
      <h4 className="font-display text-lg font-semibold text-white tracking-wide">Cotización en tiempo real</h4>
      {loading && <p className="text-sm text-[#94a3b8]">Cargando precios desde la tabla…</p>}
      {error && (
        <p className="text-sm text-red-300 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Resistencia</label>
        <select
          value={resistencia}
          onChange={(e) => setResistencia(e.target.value)}
          disabled={!precios.length}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
        >
          {resistencias.length === 0 ? (
            <option value="">—</option>
          ) : (
            resistencias.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))
          )}
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

      <div className="rounded-xl border border-[#78716c]/40 bg-[#0c0f14]/80 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1">Total estimado</p>
        <p className="font-display text-2xl font-bold text-[#ffcdd2]">
          {Number.isFinite(totalEstimado)
            ? `$${totalEstimado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : "—"}
        </p>
        <p className="text-xs text-[#64748b] mt-1">Revisa y ajusta antes de continuar.</p>
      </div>
    </div>
  );
}
