"use client";

import { useEffect, useState } from "react";
import { apiUrl, fetchApiJson } from "@/lib/api";
import { DateFieldCalendar, todayYmdLocal } from "@/components/ui/DateFieldCalendar";
import {
  buildAgendaHoursForDate,
  isAgendaDateAllowed,
  nextAllowedAgendaDateYmd,
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
  const minAgendaDate = nextAllowedAgendaDateYmd();
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
      <h4 className="font-display text-lg font-semibold text-white tracking-wide">Datos y agenda</h4>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agenda-nombre" className="block text-sm font-medium text-[#ecf0f6] mb-2">
            Nombre <span className="text-[#c62828]" aria-hidden="true">*</span>
          </label>
          <input
            id="agenda-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-required="true"
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
          />
        </div>
        <div>
          <label htmlFor="agenda-empresa" className="block text-sm font-medium text-[#ecf0f6] mb-2">
            Empresa
          </label>
          <input
            id="agenda-empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agenda-telefono" className="block text-sm font-medium text-[#ecf0f6] mb-2">
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
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
            placeholder="10 dígitos"
          />
        </div>
        <div>
          <label htmlFor="agenda-obra" className="block text-sm font-medium text-[#ecf0f6] mb-2">
            Tipo de obra
          </label>
          <select
            id="agenda-obra"
            value={obra}
            onChange={(e) => setObra(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
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
          <label htmlFor="agenda-fecha" className="block text-sm font-medium text-[#ecf0f6] mb-2">
            Fecha
          </label>
          <DateFieldCalendar
            id="agenda-fecha"
            value={fecha}
            onChange={setFecha}
            minDate={minAgendaDate || todayYmdLocal()}
            disabledDays={(date) => date.getDay() === 0}
            placeholder="Elegir fecha"
          />
          <p className="mt-1 text-xs text-[#b0bcc9]">Agenda disponible desde 2 días de anticipación. Domingos cerrado.</p>
        </div>
        <div>
          <label htmlFor="agenda-hora" className="block text-sm font-medium text-[#ecf0f6] mb-2">
            Hora
          </label>
          <select
            id="agenda-hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
          >
            {horasDisponibles.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[#b0bcc9]">L-V 06:00-16:00 h · Sáb 06:00-12:00 h.</p>
        </div>
      </div>

      <div>
        <label htmlFor="agenda-volumen" className="block text-sm font-medium text-[#ecf0f6] mb-2">
          Volumen a reservar (m³)
        </label>
        <input
          id="agenda-volumen"
          inputMode="decimal"
          value={volumen}
          onChange={(e) => setVolumen(e.target.value)}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
        />
      </div>

      <div className="rounded-xl border border-[#78716c]/35 bg-[#0c0f14]/60 px-4 py-3 text-sm">
        <p className="text-[#d8e3ee]">
          Capacidad máxima por hora: <span className="text-white font-semibold">{capacidadMaximaHora} m³</span>
        </p>
        {disp.loading && <p className="text-[#d8e3ee] mt-2">Consultando disponibilidad…</p>}
        {!disp.loading && !disp.error && (
          <p className="text-[#ecf0f6] mt-2">
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
        <label htmlFor="agenda-comentarios" className="block text-sm font-medium text-[#ecf0f6] mb-2">
          Comentarios
        </label>
        <textarea
          id="agenda-comentarios"
          rows={3}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60 resize-none"
          placeholder="Acceso, bombeo, dudas…"
        />
      </div>

      {errorReserva && (
        <p className="text-sm text-red-300 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2">{errorReserva}</p>
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
