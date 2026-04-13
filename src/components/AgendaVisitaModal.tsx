"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarPlus } from "lucide-react";
import { DateFieldCalendar, todayYmdLocal } from "@/components/ui/DateFieldCalendar";
import {
  buildGoogleCalendarVisitaUrl,
  DURACION_VISITA_MIN,
  firstAvailableVisitYmd,
  getHorariosVisita,
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
  const [fecha, setFecha] = useState(() => firstAvailableVisitYmd());
  const [hora, setHora] = useState("09:00");
  const [error, setError] = useState<string | null>(null);

  const horarios = fecha ? getHorariosVisita(fecha) : [];

  useEffect(() => {
    if (!isOpen) return;
    setNombre("");
    setEmpresa("");
    setCorreo("");
    setTelefono("");
    const primera = firstAvailableVisitYmd();
    setFecha(primera);
    const slots = getHorariosVisita(primera);
    setHora(slots.includes("09:00") ? "09:00" : slots[0] ?? "");
    setError(null);
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

  const handleAbrirCalendario = () => {
    setError(null);
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

    const url = buildGoogleCalendarVisitaUrl({
      nombre: n,
      empresa: empresa.trim(),
      correo: c,
      telefono: tel,
      fechaYmd: fecha,
      horaHm: hora,
      duracionMinutos: DURACION_VISITA_MIN,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="cotizacion-modal-scroll relative w-full max-w-lg max-h-[min(92vh,44rem)] overflow-y-auto rounded-2xl border-2 border-[#c62828]/40 bg-[#141922] p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-visita-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#c62828] font-semibold mb-1">
                  Visita a planta
                </p>
                <h3
                  id="agenda-visita-titulo"
                  className="font-display text-xl font-bold text-white tracking-wide sm:text-2xl pr-2"
                >
                  Agenda una visita
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X size={24} className="text-[#94a3b8]" />
              </button>
            </div>

            <p className="text-sm text-[#94a3b8] mb-6">
              Horario de atención: <span className="text-[#cbd5e1]">L–V 8:00 – 17:00 h</span> ·{" "}
              <span className="text-[#cbd5e1]">S 8:00 – 13:00 h</span>
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="av-nombre" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nombre <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="av-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="av-empresa" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Empresa
                </label>
                <input
                  id="av-empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Opcional"
                  autoComplete="organization"
                />
              </div>
              <div>
                <label htmlFor="av-correo" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Correo electrónico
                </label>
                <input
                  id="av-correo"
                  type="email"
                  inputMode="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Opcional"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="av-tel" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  WhatsApp o teléfono <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="av-tel"
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Ej. 55 1234 5678"
                  autoComplete="tel"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Fecha <span className="text-[#c62828]">*</span>
                </span>
                <DateFieldCalendar
                  value={fecha}
                  onChange={setFecha}
                  minDate={todayYmdLocal()}
                  placeholder="Elegir fecha"
                />
              </div>

              <div>
                <label htmlFor="av-hora" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Horario <span className="text-[#c62828]">*</span>
                </label>
                {horarios.length === 0 ? (
                  <p className="text-sm text-amber-200 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2">
                    No hay horarios este día (domingo cerrado o fecha no válida). Elige otra fecha.
                  </p>
                ) : (
                  <select
                    id="av-hora"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
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
              <p className="mt-4 text-sm text-red-300 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-lg border border-[#94a3b8]/35 text-[#cbd5e1] hover:bg-white/5 transition-colors sm:min-w-[120px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAbrirCalendario}
                className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#c62828] hover:bg-[#e53935] text-white font-display font-bold uppercase tracking-wide text-sm transition-colors"
              >
                <CalendarPlus size={20} className="shrink-0" aria-hidden />
                Abrir en Google Calendar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
