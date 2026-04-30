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
            className="cotizacion-modal-scroll relative w-full max-w-lg max-h-[min(92vh,44rem)] overflow-y-auto rounded-2xl border-2 border-[#c62828]/75 bg-[#141922] p-5 shadow-[0_0_0_1px_rgba(198,40,40,0.45),0_0_36px_-4px_rgba(198,40,40,0.35),0_20px_50px_-12px_rgba(0,0,0,0.55)] ring-2 ring-[#c62828]/25 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-visita-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#c62828] font-semibold mb-1">
                  Visita a planta / obra
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
                <X size={24} className="text-[#d8e3ee]" />
              </button>
            </div>

            <p className="text-sm text-[#d8e3ee] mb-6">
              Horario de atención: <span className="text-[#ecf0f6]">L–V 8:00 – 17:00 h</span> ·{" "}
              <span className="text-[#ecf0f6]">S 8:00 – 13:00 h</span>
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="av-nombre" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Nombre <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="av-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="av-empresa" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Empresa
                </label>
                <input
                  id="av-empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Opcional"
                  autoComplete="organization"
                />
              </div>
              <div>
                <label htmlFor="av-correo" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Correo electrónico
                </label>
                <input
                  id="av-correo"
                  type="email"
                  inputMode="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Opcional"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="av-tel" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  WhatsApp o teléfono <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="av-tel"
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                  placeholder="Ej. 55 1234 5678"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="av-visita" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Tipo de visita <span className="text-[#c62828]">*</span>
                </label>
                <select
                  id="av-visita"
                  value={visita}
                  onChange={(e) => setVisita(e.target.value as TipoVisitaAgendada)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
                >
                  {TIPOS_VISITA_AGENDADA.map((v) => (
                    <option key={v} value={v}>
                      {v === "Obra" ? "Visita a Obra" : "Visita a Planta"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-sm font-medium text-[#ecf0f6] mb-2">
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
                <label htmlFor="av-hora" className="block text-sm font-medium text-[#ecf0f6] mb-2">
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
                    className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
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
            {okMsg && (
              <p className="mt-4 text-sm text-emerald-200 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2">
                {okMsg}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-3 px-4 rounded-lg border border-[#cfd8e4]/35 text-[#ecf0f6] hover:bg-white/5 transition-colors sm:min-w-[120px] disabled:opacity-50"
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
