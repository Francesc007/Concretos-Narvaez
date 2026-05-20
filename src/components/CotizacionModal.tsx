"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { CONFIG } from "@/config";
import { DateFieldCalendar, todayYmdLocal } from "@/components/ui/DateFieldCalendar";

const RESISTENCIA_OPCIONES = [
  { value: "hasta-200", label: "Hasta 200 kg/cm²" },
  { value: "200-250", label: "200 a 250 kg/cm²" },
  { value: "mas-250", label: "Más de 250 kg/cm²" },
] as const;

const DISTANCIA_OPCIONES = [
  { value: "0-10", label: "0 a 10 km" },
  { value: "10-20", label: "10 a 20 km" },
  { value: "mas-20", label: "Más de 20 km" },
] as const;

const ENTREGA_OPCIONES = [
  { value: "tiro-directo", label: "Tiro directo" },
  { value: "bombeo", label: "Bombeo" },
] as const;

function labelEntrega(value: string) {
  return ENTREGA_OPCIONES.find((o) => o.value === value)?.label ?? value;
}

function labelResistencia(value: string) {
  return RESISTENCIA_OPCIONES.find((o) => o.value === value)?.label ?? value;
}

function labelDistancia(value: string) {
  return DISTANCIA_OPCIONES.find((o) => o.value === value)?.label ?? value;
}

function WhatsAppIconSmall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface CotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CotizacionModal({ isOpen, onClose }: CotizacionModalProps) {
  const [nombre, setNombre] = useState("");
  const [entrega, setEntrega] = useState<string>(ENTREGA_OPCIONES[0].value);
  const [tipoObra, setTipoObra] = useState("residencial");
  const [resistencia, setResistencia] = useState<string>(RESISTENCIA_OPCIONES[0].value);
  const [distancia, setDistancia] = useState<string>(DISTANCIA_OPCIONES[0].value);
  const [volumen, setVolumen] = useState("");
  const [fecha, setFecha] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [autorizoDatos, setAutorizoDatos] = useState(false);

  function cerrarModal() {
    setAutorizoDatos(false);
    onClose();
  }

  function resetForm() {
    setNombre("");
    setEntrega(ENTREGA_OPCIONES[0].value);
    setTipoObra("residencial");
    setResistencia(RESISTENCIA_OPCIONES[0].value);
    setDistancia(DISTANCIA_OPCIONES[0].value);
    setVolumen("");
    setFecha("");
    setComentarios("");
    setAutorizoDatos(false);
  }

  const handleEnviar = () => {
    if (!autorizoDatos) return;
    const lineas = [
      `Hola ${CONFIG.companyDisplayName}, solicito cotización de concreto premezclado.`,
      `Tiro directo o bombeo: ${labelEntrega(entrega)}`,
      nombre.trim() ? `Nombre: ${nombre.trim()}` : null,
      `Tipo de obra: ${tipoObra}`,
      `Resistencia requerida: ${labelResistencia(resistencia)}`,
      `Distancia a planta / obra: ${labelDistancia(distancia)}`,
      volumen.trim() ? `Volumen estimado (m³): ${volumen.trim()}` : null,
      fecha ? `Fecha tentativa de entrega: ${fecha}` : null,
      comentarios.trim() ? `Detalles: ${comentarios.trim()}` : null,
      `Quedo atento(a) a su respuesta. ¡Gracias!`,
    ].filter(Boolean) as string[];
    const mensaje = encodeURIComponent(lineas.join("\n"));
    window.open(`https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${mensaje}`, "_blank");
    resetForm();
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
            onClick={cerrarModal}
            className="absolute inset-0 bg-black/75"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="cotizacion-modal-scroll relative w-full max-w-md max-h-[min(90vh,36rem)] overflow-y-auto rounded-2xl border-2 border-tepexi-accent/75 bg-[#141922] p-5 shadow-[0_0_0_1px_rgba(233,117,40,0.45),0_0_36px_-4px_rgba(233,117,40,0.32),0_20px_50px_-12px_rgba(0,0,0,0.55)] ring-2 ring-tepexi-accent/25 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cotizacion-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-5">
              <h3
                id="cotizacion-modal-title"
                className="font-display text-xl font-bold text-white tracking-wide sm:text-2xl pr-2"
              >
                Cotización por WhatsApp
              </h3>
              <button
                type="button"
                onClick={cerrarModal}
                className="shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X size={24} className="text-[#d8e3ee]" />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-[#ecf0f6] mb-6 text-center sm:text-left">
              Completa los datos y generaremos un mensaje listo para tu atención personalizada
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="cot-entrega" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Tiro directo o bombeo
                </label>
                <select
                  id="cot-entrega"
                  value={entrega}
                  onChange={(e) => setEntrega(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/35 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tepexi-accent/60"
                >
                  {ENTREGA_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cot-nombre" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Nombre o empresa
                </label>
                <input
                  id="cot-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/35 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-tepexi-accent/60"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label htmlFor="cot-tipo" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Tipo de obra
                </label>
                <select
                  id="cot-tipo"
                  value={tipoObra}
                  onChange={(e) => setTipoObra(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/35 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tepexi-accent/60"
                >
                  <option value="residencial">Particular</option>
                  <option value="comercial">Residencial</option>
                  <option value="infraestructura">Comercial / industrial</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="cot-res" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Resistencia requerida
                </label>
                <select
                  id="cot-res"
                  value={resistencia}
                  onChange={(e) => setResistencia(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/35 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tepexi-accent/60"
                >
                  {RESISTENCIA_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cot-dist" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Distancia (planta / entrega)
                </label>
                <select
                  id="cot-dist"
                  value={distancia}
                  onChange={(e) => setDistancia(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/35 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tepexi-accent/60"
                >
                  {DISTANCIA_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cot-vol" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Volumen estimado (m³)
                </label>
                <input
                  id="cot-vol"
                  inputMode="decimal"
                  value={volumen}
                  onChange={(e) => setVolumen(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/35 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-tepexi-accent/60"
                  placeholder="Ej. 12"
                />
              </div>

              <div>
                <label htmlFor="cot-fecha" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Fecha tentativa
                </label>
                <DateFieldCalendar
                  id="cot-fecha"
                  value={fecha}
                  onChange={setFecha}
                  minDate={todayYmdLocal()}
                  placeholder="Elegir fecha"
                />
              </div>

              <div>
                <label htmlFor="cot-com" className="block text-sm font-medium text-[#ecf0f6] mb-2">
                  Comentarios
                </label>
                <textarea
                  id="cot-com"
                  rows={3}
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/35 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-tepexi-accent/60 resize-none"
                  placeholder="Acceso a obra, horario preferido…"
                />
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#cfd8e4]/20 bg-[#0c0f14]/80 p-4 text-left text-sm text-[#ecf0f6]">
              <input
                type="checkbox"
                checked={autorizoDatos}
                onChange={(e) => setAutorizoDatos(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#b8c4d8]/55 text-[#25D366] focus:ring-[#25D366]"
              />
              <span>
                Autorizo el uso de mis datos para que {CONFIG.companyDisplayName} me contacte con la cotización.
              </span>
            </label>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={cerrarModal}
                className="flex-1 py-3 rounded-lg border border-[#cfd8e4]/35 text-[#ecf0f6] hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!autorizoDatos}
                onClick={handleEnviar}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-3 font-bold text-white transition-all hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <WhatsAppIconSmall className="h-5 w-5 shrink-0" />
                Enviar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
