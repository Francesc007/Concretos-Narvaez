"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { apiUrl, fetchApiJson } from "@/lib/api";
import { DateFieldCalendar } from "@/components/ui/DateFieldCalendar";
import {
  buildAgendaHoursForDate,
  isAgendaDateAllowed,
  nextAllowedAgendaDateYmd,
  todayYmdCdmx,
  validateAgendaSlot,
} from "@/lib/agendaRules";

const OBRA_OPTIONS = [
  { value: "residencial", label: "Particular" },
  { value: "comercial", label: "Residencial" },
  { value: "infraestructura", label: "Comercial / industrial" },
];

export interface AgendaSelectorProps {
  nombre: string;
  setNombre: (v: string) => void;
  telefono: string;
  setTelefono: (v: string) => void;
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
  telefono,
  setTelefono,
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
  const minAgendaDate = nextAllowedAgendaDateYmd() || todayYmdCdmx();
  const horasDisponibles = buildAgendaHoursForDate(fecha);
  const horarioError = validateAgendaSlot(fecha, hora);

  useEffect(() => {
    const nextDate = nextAllowedAgendaDateYmd();
    if (!isAgendaDateAllowed(fecha)) {
      setFecha(nextDate);
      return;
    }

    const horas = buildAgendaHoursForDate(fecha);
    if (horas.length > 0 && !horas.includes(hora)) {
      setHora(horas[0]);
    }
  }, [fecha, hora, setFecha, setHora]);

  useEffect(() => {
    if (!fecha || !hora) return;
    if (horarioError) {
      setDisp({ usadoM3: 0, disponibleM3: 0, loading: false, error: horarioError });
      return;
    }

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
  }, [fecha, hora, horarioError]);

  const volNum = parseFloat(volumen.replace(",", ".")) || 0;
  const cupoOk = volNum > 0 && volNum <= disp.disponibleM3 && !disp.loading && !disp.error && !horarioError;

  return (
    <div className="space-y-5">
      <h4 className="font-display text-lg font-semibold tracking-wide text-[var(--tepexi-logo-navy)]">Datos y agenda</h4>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agenda-nombre" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Nombre <span className="text-[#c62828]" aria-hidden="true">*</span>
          </label>
          <input
            id="agenda-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-required="true"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
          />
        </div>
        <div>
          <label htmlFor="agenda-empresa" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Empresa
          </label>
          <input
            id="agenda-empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agenda-telefono" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Teléfono <span className="text-[#c62828]" aria-hidden="true">*</span>
          </label>
          <input
            id="agenda-telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            aria-required="true"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
            placeholder="10 dígitos"
          />
        </div>
        <div>
          <label htmlFor="agenda-obra" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Tipo de obra
          </label>
          <select
            id="agenda-obra"
            value={obra}
            onChange={(e) => setObra(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
          >
            {OBRA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agenda-fecha" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Fecha
          </label>
          <DateFieldCalendar
            id="agenda-fecha"
            value={fecha}
            onChange={setFecha}
            minDate={minAgendaDate}
            disabledDays={(date) => !isAgendaDateAllowed(format(date, "yyyy-MM-dd"))}
            placeholder="Elegir fecha"
          />
        </div>
        <div>
          <label htmlFor="agenda-hora" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Hora
          </label>
          <select
            id="agenda-hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
          >
            {horasDisponibles.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="agenda-volumen" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
          Volumen a reservar (m³)
        </label>
        <input
          id="agenda-volumen"
          inputMode="decimal"
          value={volumen}
          onChange={(e) => setVolumen(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <p className="text-slate-700">
          Capacidad máxima por hora: <span className="font-semibold text-[var(--tepexi-logo-navy)]">{capacidadMaximaHora} m³</span>
        </p>
        {disp.loading && <p className="mt-2 text-slate-600">Consultando disponibilidad…</p>}
        {!disp.loading && !disp.error && (
          <p className="mt-2 text-[var(--tepexi-text-body)]">
            Ocupado en este horario: <span className="font-medium text-[var(--tepexi-logo-navy)]">{disp.usadoM3.toFixed(2)} m³</span> · Libre:{" "}
            <span className="font-semibold text-emerald-700">{disp.disponibleM3.toFixed(2)} m³</span>
          </p>
        )}
        {disp.error && <p className="mt-2 text-red-700">{disp.error}</p>}
        {volNum > disp.disponibleM3 && !disp.loading && (
          <p className="mt-2 text-amber-800">El volumen supera el cupo disponible en este horario.</p>
        )}
      </div>

      <div>
        <label htmlFor="agenda-comentarios" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
          Comentarios
        </label>
        <textarea
          id="agenda-comentarios"
          rows={3}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
          placeholder="Acceso, bombeo, dudas…"
        />
      </div>

      {errorReserva && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorReserva}</p>
      )}

      <button
        type="button"
        disabled={!nombre.trim() || !telefono.trim() || !fecha || !cupoOk || reservando}
        onClick={onSubmitReserva}
        className="w-full py-3 rounded-lg bg-[#c62828] hover:bg-[#e53935] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wide transition-colors"
      >
        {reservando ? "Guardando reserva…" : "Reservar y abrir WhatsApp"}
      </button>
    </div>
  );
}
