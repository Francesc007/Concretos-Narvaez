"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, X } from "lucide-react";
import { DateFieldCalendar, todayYmdLocal } from "@/components/ui/DateFieldCalendar";
import { apiUrl, fetchApiJson } from "@/lib/api";
import {
  firstAvailableVisitYmd,
  getHorariosVisita,
  TIPOS_VISITA_AGENDADA,
  type TipoVisitaAgendada,
} from "@/lib/agendaVisita";

interface AgendaVisitaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function emailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function AgendaVisitaModal({ isOpen, onClose }: AgendaVisitaModalProps) {
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [visita, setVisita] = useState<TipoVisitaAgendada>("Obra");
  const [fecha, setFecha] = useState(() => firstAvailableVisitYmd());
  const [hora, setHora] = useState("09:00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const horarios = fecha ? getHorariosVisita(fecha) : [];

  useEffect(() => {
    if (!isOpen) return;
    setNombre("");
    setEmpresa("");
    setCorreo("");
    setTelefono("");
    setVisita("Obra");
    const primera = firstAvailableVisitYmd();
    setFecha(primera);
    const slots = getHorariosVisita(primera);
    setHora(slots.includes("09:00") ? "09:00" : slots[0] ?? "");
    setError(null);
    setLoading(false);
    setOkMsg(null);
  }, [isOpen]);

  useEffect(() => {
    if (!fecha) return;
    const slots = getHorariosVisita(fecha);
    if (slots.length === 0) {
      setHora("");
      return;
    }
    setHora((prev) => (slots.includes(prev) ? prev : slots[0]!));
  }, [fecha]);

  const handleEnviar = async () => {
    setError(null);
    setOkMsg(null);
    const n = nombre.trim();
    if (n.length < 2) {
      setError("Indica tu nombre completo.");
      return;
    }
    const c = correo.trim();
    if (c && !emailOk(c)) {
      setError("Ingresa un correo electrónico válido o déjalo vacío.");
      return;
    }
    const tel = telefono.trim();
    if (tel.length < 8) {
      setError("Ingresa un WhatsApp o teléfono de contacto.");
      return;
    }
    if (!fecha) {
      setError("Elige una fecha.");
      return;
    }
    const slots = getHorariosVisita(fecha);
    if (slots.length === 0) {
      setError("Los domingos no hay visitas. Elige otro día.");
      return;
    }
    if (!hora || !slots.includes(hora)) {
      setError("Selecciona un horario disponible.");
      return;
    }

    setLoading(true);
    try {
      await fetchApiJson<{ ok?: boolean }>(apiUrl("/api/visitas-agendadas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: n,
          empresa: empresa.trim(),
          correo: c,
          telefono: tel,
          fecha,
          horario: hora,
          visita,
        }),
      });
      setOkMsg("Tu visita quedó registrada. Te contactaremos para confirmar.");
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain px-4 py-8 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))] sm:items-center sm:px-6 sm:py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="cotizacion-modal-scroll relative w-full max-w-lg max-h-[min(92vh,44rem)] overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-[0_20px_50px_-12px_rgba(19,47,76,0.15)] ring-1 ring-slate-200/80 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-visita-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#c62828]">
                  Visita a planta / obra
                </p>
                <h3
                  id="agenda-visita-titulo"
                  className="font-display pr-2 text-xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-2xl"
                >
                  Agenda una visita
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[var(--tepexi-logo-navy)]"
                aria-label="Cerrar"
              >
                <X size={24} aria-hidden />
              </button>
            </div>

            <p className="mb-6 text-sm text-[var(--tepexi-text-body)]">
              Horario de atención: <span className="font-medium text-[var(--tepexi-logo-navy)]">Lun–Vie 9:00 – 16:00 h</span> /{" "}
              <span className="font-medium text-[var(--tepexi-logo-navy)]">Sab 9:00 – 12:00 h</span>
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="av-nombre" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
                  Nombre <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="av-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="av-empresa" className="block text-sm font-medium text-[var(--tepexi-text-body)] mb-2">
                  Empresa
                </label>
                <input
                  id="av-empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
                  placeholder="Opcional"
                  autoComplete="organization"
                />
              </div>
              <div>
                <label htmlFor="av-correo" className="block text-sm font-medium text-[var(--tepexi-text-body)] mb-2">
                  Correo electrónico
                </label>
                <input
                  id="av-correo"
                  type="email"
                  inputMode="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
                  placeholder="Opcional"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="av-tel" className="block text-sm font-medium text-[var(--tepexi-text-body)] mb-2">
                  WhatsApp o teléfono <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="av-tel"
                  name="telefono"
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
                  placeholder="Ej. 55 1234 5678"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="av-visita" className="block text-sm font-medium text-[var(--tepexi-text-body)] mb-2">
                  Tipo de visita <span className="text-[#c62828]">*</span>
                </label>
                <select
                  id="av-visita"
                  value={visita}
                  onChange={(e) => setVisita(e.target.value as TipoVisitaAgendada)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
                >
                  {TIPOS_VISITA_AGENDADA.map((v) => (
                    <option key={v} value={v}>
                      {v === "Obra" ? "Visita a Obra" : "Visita a Planta"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-sm font-medium text-[var(--tepexi-text-body)] mb-2">
                  Fecha <span className="text-[#c62828]">*</span>
                </span>
                <DateFieldCalendar
                  value={fecha}
                  onChange={setFecha}
                  minDate={todayYmdLocal()}
                  disabledDays={(date) => date.getDay() === 0}
                  placeholder="Elegir fecha"
                />
              </div>

              <div>
                <label htmlFor="av-hora" className="block text-sm font-medium text-[var(--tepexi-text-body)] mb-2">
                  Horario <span className="text-[#c62828]">*</span>
                </label>
                {horarios.length === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    No hay horarios este día (domingo cerrado o fecha no válida). Elige otra fecha.
                  </p>
                ) : (
                  <select
                    id="av-hora"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
                  >
                    {horarios.map((h) => (
                      <option key={h} value={h}>
                        {h} h
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}
            {okMsg && (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {okMsg}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-4 py-3 text-[var(--tepexi-logo-navy)] transition-colors hover:bg-slate-50 sm:min-w-[120px] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviar}
                disabled={loading || !!okMsg}
                className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#c62828] hover:bg-[#e53935] text-white font-display font-bold uppercase tracking-wide text-sm transition-colors disabled:opacity-60 disabled:pointer-events-none"
              >
                <CalendarCheck size={20} className="shrink-0" aria-hidden />
                {loading ? "Enviando…" : "Confirmar visita"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
