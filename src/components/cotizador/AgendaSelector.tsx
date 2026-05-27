"use client";

import { useEffect, useMemo, useState } from "react";
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
import { MENSAJE_COTIZACION_ASESOR } from "@/lib/cotizacion";

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
  volumenMaximoCotizadorM3: number;
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
  volumenMaximoCotizadorM3,
  onSubmitReserva,
  reservando,
  errorReserva,
}: AgendaSelectorProps) {
  const [disp, setDisp] = useState<{
    usadoM3: number;
    disponibleM3: number;
    horasBloqueadasLogistica: string[];
    puedeAgendar?: boolean;
    sugerenciaHora: string | null;
    mensajeCapacidad: string | null;
    loading: boolean;
    error: string | null;
  }>({
    usadoM3: 0,
    disponibleM3: 0,
    horasBloqueadasLogistica: [],
    sugerenciaHora: null,
    mensajeCapacidad: null,
    loading: true,
    error: null,
  });
  const minAgendaDate = nextAllowedAgendaDateYmd() || todayYmdCdmx();
  const horasDisponibles = buildAgendaHoursForDate(fecha);
  const horarioError = validateAgendaSlot(fecha, hora);
  const volNum = parseFloat(volumen.replace(",", ".")) || 0;
  const excedeLimiteReserva = volNum > volumenMaximoCotizadorM3;

  const [bloqueosPrioridad, setBloqueosPrioridad] = useState<string[]>([]);

  const horasBloqueadasUi = useMemo(() => {
    const set = new Set<string>([...bloqueosPrioridad, ...disp.horasBloqueadasLogistica]);
    return [...set].sort();
  }, [bloqueosPrioridad, disp.horasBloqueadasLogistica]);

  useEffect(() => {
    if (!fecha || !isAgendaDateAllowed(fecha)) {
      setBloqueosPrioridad([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApiJson<{ horasBloqueadasLogistica?: string[] }>(
          `${apiUrl("/api/agenda-logistics-blocks")}?${new URLSearchParams({ fecha })}`,
        );
        if (!cancelled) setBloqueosPrioridad(data.horasBloqueadasLogistica ?? []);
      } catch {
        if (!cancelled) setBloqueosPrioridad([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fecha]);

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
      setDisp({
        usadoM3: 0,
        disponibleM3: 0,
        horasBloqueadasLogistica: [],
        sugerenciaHora: null,
        mensajeCapacidad: null,
        loading: false,
        error: horarioError,
      });
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setDisp((d) => ({ ...d, loading: true, error: null }));
      try {
        const q = new URLSearchParams({ fecha, hora });
        if (volNum > 0) q.set("volumen", String(volNum));
        const data = await fetchApiJson<{
          usadoM3: number;
          disponibleM3: number;
          horasBloqueadasLogistica?: string[];
          puedeAgendar?: boolean;
          sugerenciaHora?: string | null;
          mensajeCapacidad?: string | null;
        }>(`${apiUrl("/api/availability")}?${q}`);
        if (!cancelled) {
          setDisp({
            usadoM3: data.usadoM3,
            disponibleM3: data.disponibleM3,
            horasBloqueadasLogistica: data.horasBloqueadasLogistica ?? [],
            puedeAgendar: data.puedeAgendar,
            sugerenciaHora: data.sugerenciaHora ?? null,
            mensajeCapacidad: data.mensajeCapacidad ?? null,
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
  }, [fecha, hora, horarioError, volNum]);

  useEffect(() => {
    if (!fecha || !isAgendaDateAllowed(fecha)) return;
    if (horasBloqueadasUi.length === 0) return;
    const horas = buildAgendaHoursForDate(fecha);
    if (!horasBloqueadasUi.includes(hora)) return;
    const next = horas.find((h) => !horasBloqueadasUi.includes(h));
    if (next && next !== hora) setHora(next);
  }, [fecha, hora, horasBloqueadasUi, setHora]);

  const capacidadFlujoOk =
    volNum > 0 &&
    !disp.loading &&
    !disp.error &&
    !horarioError &&
    !excedeLimiteReserva &&
    !horasBloqueadasUi.includes(hora) &&
    disp.puedeAgendar === true;
  const cupoOk = capacidadFlujoOk;

  return (
    <div className="space-y-5">
      <h4 className="font-display text-lg font-semibold tracking-wide text-[var(--tepexi-logo-navy)]">Datos y agenda</h4>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agenda-nombre" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Nombre <span className="text-tepexi-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="agenda-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-required="true"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20"
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
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agenda-telefono" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Teléfono <span className="text-tepexi-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="agenda-telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            aria-required="true"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20"
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
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20"
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
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-[var(--tepexi-logo-navy)] outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20"
          >
            {horasDisponibles.map((h) => (
              <option key={h} value={h} disabled={horasBloqueadasUi.includes(h)}>
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
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <p className="text-slate-700">
          Capacidad máxima por hora: <span className="font-semibold text-[var(--tepexi-logo-navy)]">{capacidadMaximaHora} m³</span>
        </p>
        {disp.loading && <p className="mt-2 text-slate-600">Consultando disponibilidad…</p>}
        {!disp.loading && !disp.error && (
          <p className="mt-2 text-xs text-slate-600">
            Los m³ mostrados consideran el flujo del día: pedidos grandes pueden ocupar varias horas seguidas.
          </p>
        )}
        {!disp.loading && !disp.error && (
          <p className="mt-2 text-[var(--tepexi-text-body)]">
            Ocupado en este horario: <span className="font-medium text-[var(--tepexi-logo-navy)]">{disp.usadoM3.toFixed(2)} m³</span> · Libre:{" "}
            <span className="font-semibold text-emerald-700">{disp.disponibleM3.toFixed(2)} m³</span>
          </p>
        )}
        {disp.error && <p className="mt-2 text-red-700">{disp.error}</p>}
        {excedeLimiteReserva && volNum > 0 && (
          <p className="mt-2 text-amber-800">{MENSAJE_COTIZACION_ASESOR}</p>
        )}
        {volNum > 0 &&
          !disp.loading &&
          !disp.error &&
          disp.puedeAgendar === false &&
          disp.mensajeCapacidad && (
            <p className="mt-2 text-amber-800">{disp.mensajeCapacidad}</p>
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
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-tepexi-accent focus:ring-2 focus:ring-tepexi-accent/20"
          placeholder="Acceso, bombeo, dudas…"
        />
      </div>

      {errorReserva && (
        <p className="rounded-lg border border-tepexi-accent/25 bg-tepexi-accent-soft px-3 py-2 text-sm text-[var(--tepexi-logo-navy)]">{errorReserva}</p>
      )}

      <button
        type="button"
        disabled={!nombre.trim() || !telefono.trim() || !fecha || !cupoOk || reservando}
        onClick={onSubmitReserva}
        className="w-full py-3 rounded-lg bg-tepexi-accent hover:bg-tepexi-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wide transition-colors"
      >
        {reservando ? "Guardando reserva…" : "Reservar y abrir WhatsApp"}
      </button>
    </div>
  );
}
