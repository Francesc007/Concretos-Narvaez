"use client";

import { useEffect, useState } from "react";
import { apiUrl, fetchApiJson } from "@/lib/api";

const OBRA_OPTIONS = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial / industrial" },
  { value: "infraestructura", label: "Infraestructura / civil" },
];

function buildHoras(): string[] {
  const out: string[] = [];
  for (let h = 7; h <= 17; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
  }
  return out;
}

const HORAS = buildHoras();

export interface AgendaSelectorProps {
  nombre: string;
  setNombre: (v: string) => void;
  empresa: string;
  setEmpresa: (v: string) => void;
  obra: string;
  setObra: (v: string) => void;
  fecha: string;
  setFecha: (v: string) => void;
  hora: string;
  setHora: (v: string) => void;
  volumen: string;
  setVolumen: (v: string) => void;
  comentarios: string;
  setComentarios: (v: string) => void;
  capacidadMaximaHora: number;
  onSubmitReserva: () => void;
  reservando: boolean;
  errorReserva: string | null;
}

export function AgendaSelector({
  nombre,
  setNombre,
  empresa,
  setEmpresa,
  obra,
  setObra,
  fecha,
  setFecha,
  hora,
  setHora,
  volumen,
  setVolumen,
  comentarios,
  setComentarios,
  capacidadMaximaHora,
  onSubmitReserva,
  reservando,
  errorReserva,
}: AgendaSelectorProps) {
  const [disp, setDisp] = useState<{
    usadoM3: number;
    disponibleM3: number;
    loading: boolean;
    error: string | null;
  }>({ usadoM3: 0, disponibleM3: 0, loading: true, error: null });

  useEffect(() => {
    if (!fecha || !hora) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setDisp((d) => ({ ...d, loading: true, error: null }));
      try {
        const q = new URLSearchParams({ fecha, hora });
        const data = await fetchApiJson<{
          usadoM3: number;
          disponibleM3: number;
        }>(`${apiUrl("/api/availability")}?${q}`);
        if (!cancelled) {
          setDisp({
            usadoM3: data.usadoM3,
            disponibleM3: data.disponibleM3,
            loading: false,
            error: null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setDisp((d) => ({
            ...d,
            loading: false,
            error: e instanceof Error ? e.message : "Error",
          }));
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [fecha, hora]);

  const volNum = parseFloat(volumen.replace(",", ".")) || 0;
  const cupoOk = volNum > 0 && volNum <= disp.disponibleM3 && !disp.loading && !disp.error;

  const minFecha = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <h4 className="font-display text-lg font-semibold text-white tracking-wide">Datos y agenda</h4>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Empresa</label>
          <input
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Obra</label>
        <select
          value={obra}
          onChange={(e) => setObra(e.target.value)}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
        >
          {OBRA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Fecha</label>
          <input
            type="date"
            min={minFecha}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Hora</label>
          <select
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Volumen a reservar (m³)</label>
        <input
          inputMode="decimal"
          value={volumen}
          onChange={(e) => setVolumen(e.target.value)}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
        />
      </div>

      <div className="rounded-xl border border-[#78716c]/35 bg-[#0c0f14]/60 px-4 py-3 text-sm">
        <p className="text-[#94a3b8]">
          Capacidad máxima por hora: <span className="text-white font-semibold">{capacidadMaximaHora} m³</span>
        </p>
        {disp.loading && <p className="text-[#94a3b8] mt-2">Consultando disponibilidad…</p>}
        {!disp.loading && !disp.error && (
          <p className="text-[#cbd5e1] mt-2">
            Ocupado en este horario: <span className="text-white">{disp.usadoM3.toFixed(2)} m³</span> · Libre:{" "}
            <span className="text-[#86efac] font-semibold">{disp.disponibleM3.toFixed(2)} m³</span>
          </p>
        )}
        {disp.error && <p className="text-red-300 mt-2">{disp.error}</p>}
        {volNum > disp.disponibleM3 && !disp.loading && (
          <p className="text-amber-200 mt-2">El volumen supera el cupo disponible en este horario.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Comentarios</label>
        <textarea
          rows={3}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60 resize-none"
          placeholder="Acceso, bombeo, dudas…"
        />
      </div>

      {errorReserva && (
        <p className="text-sm text-red-300 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2">{errorReserva}</p>
      )}

      <button
        type="button"
        disabled={!nombre.trim() || !fecha || !cupoOk || reservando}
        onClick={onSubmitReserva}
        className="w-full py-3 rounded-lg bg-[#c62828] hover:bg-[#e53935] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wide transition-colors"
      >
        {reservando ? "Guardando reserva…" : "Reservar y abrir WhatsApp"}
      </button>
    </div>
  );
}
