"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { CONFIG } from "@/config";
import { apiUrl, fetchApiJson } from "@/lib/api";
import {
  calcularTotalCotizacion,
  cotizacionTieneAlgunPrecio,
  labelResistenciaKg,
  precioM3ParaResistencia,
  type ResistenciaKg,
} from "@/lib/cotizacion";
import type { CotizacionPreciosConfig, PrecioRow } from "@/types/sheets";
import { Cotizador } from "./Cotizador";
import { AgendaSelector } from "./AgendaSelector";

const OBRA_LABELS: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial / industrial",
  infraestructura: "Infraestructura / civil",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CotizadorReservaModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [cotizacion, setCotizacion] = useState<CotizacionPreciosConfig | null>(null);
  const [capacidadMaximaHora, setCapacidadMaximaHora] = useState(30);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);

  const [resistenciaKg, setResistenciaKg] = useState<ResistenciaKg>(250);
  const [tipoVaciado, setTipoVaciado] = useState<"tiro_directo" | "bombeo">("tiro_directo");
  const [volumen, setVolumen] = useState("");

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [obra, setObra] = useState("residencial");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState("09:00");
  const [comentarios, setComentarios] = useState("");

  const [reservando, setReservando] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [mensajePagoAbierto, setMensajePagoAbierto] = useState(false);
  const datosWaPendientes = useRef<{
    total: number;
    resistencia: string;
    vaciado: string;
    vol: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMensajePagoAbierto(false);
    datosWaPendientes.current = null;
    setStep(1);
    setLoadErr(null);
    setLoadingSheet(true);
    (async () => {
      try {
        const [j1, j2] = await Promise.all([
          fetchApiJson<{ prices: PrecioRow[]; cotizacion: CotizacionPreciosConfig }>(
            apiUrl("/api/prices"),
          ),
          fetchApiJson<{ capacidadMaximaHora: number }>(apiUrl("/api/sheet-config")),
        ]);
        setCotizacion(j1.cotizacion);
        if (!cotizacionTieneAlgunPrecio(j1.cotizacion)) {
          setLoadErr(
            'No se pudo leer precio para 150, 250, 350 o 500 kg/cm². En la hoja "Precios", coloca en la columna A la resistencia y en la B el precio por m³ (o usa encabezados que incluyan "Resistencia" y "Precio" / precio por m³).',
          );
        }
        setCapacidadMaximaHora(Number(j2.capacidadMaximaHora) || 30);
      } catch (e) {
        setLoadErr(
          e instanceof Error
            ? e.message
            : "API no disponible. Revisa `.env.local` (GOOGLE_*) y los logs del servidor Next.js.",
        );
        setCotizacion(null);
      } finally {
        setLoadingSheet(false);
      }
    })();
  }, [isOpen]);

  const precioM3Actual = useMemo(
    () => precioM3ParaResistencia(cotizacion, resistenciaKg),
    [cotizacion, resistenciaKg],
  );

  const totalEstimado = useMemo(() => {
    const vol = parseFloat(volumen.replace(",", ".")) || 0;
    if (!cotizacion) return 0;
    return calcularTotalCotizacion(vol, tipoVaciado, precioM3ParaResistencia(cotizacion, resistenciaKg));
  }, [cotizacion, tipoVaciado, volumen, resistenciaKg]);

  const puedeAvanzar =
    parseFloat(volumen.replace(",", ".")) > 0 && !!cotizacion && precioM3Actual > 0 && !loadErr;

  function resetReservaForm() {
    setNombre("");
    setEmpresa("");
    setObra("residencial");
    setFecha(new Date().toISOString().slice(0, 10));
    setHora("09:00");
    setComentarios("");
    setVolumen("");
    setResistenciaKg(250);
    setTipoVaciado("tiro_directo");
    setStep(1);
  }

  function cerrarModal() {
    if (mensajePagoAbierto) {
      datosWaPendientes.current = null;
      setMensajePagoAbierto(false);
      resetReservaForm();
    }
    onClose();
  }

  function confirmarMensajePagoYWhatsApp() {
    const d = datosWaPendientes.current;
    if (d) abrirWhatsAppReserva(d);
    datosWaPendientes.current = null;
    setMensajePagoAbierto(false);
    resetReservaForm();
    onClose();
  }

  const abrirWhatsAppReserva = (extra: { total: number; resistencia: string; vaciado: string; vol: number }) => {
    const lineas = [
      `*Reserva Concretos Tepexi*`,
      `Nombre: ${nombre.trim()}`,
      empresa.trim() ? `Empresa: ${empresa.trim()}` : null,
      `Obra: ${OBRA_LABELS[obra] ?? obra}`,
      `Fecha: ${fecha}  Hora: ${hora}`,
      `Volumen: ${extra.vol} m³`,
      `Resistencia: ${extra.resistencia}`,
      `Vaciado: ${extra.vaciado}`,
      `Total estimado: $${extra.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      `Estado en agenda: Reservado`,
      comentarios.trim() ? `Comentarios: ${comentarios.trim()}` : null,
    ].filter(Boolean) as string[];
    const text = encodeURIComponent(lineas.join("\n"));
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${text}`, "_blank");
  };

  const handleReservar = async () => {
    setErrorReserva(null);
    const vol = parseFloat(volumen.replace(",", ".")) || 0;
    if (!nombre.trim() || vol <= 0) {
      setErrorReserva("Completa nombre y volumen válido.");
      return;
    }
    if (!cotizacion) {
      setErrorReserva("No hay datos de cotización.");
      return;
    }
    const p = precioM3ParaResistencia(cotizacion, resistenciaKg);
    if (p <= 0) {
      setErrorReserva("Selecciona una resistencia con precio válido.");
      return;
    }
    setReservando(true);
    try {
      const total = calcularTotalCotizacion(vol, tipoVaciado, p);

      await fetchApiJson<{ ok?: boolean }>(apiUrl("/api/reserve"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          empresa: empresa.trim(),
          obra: OBRA_LABELS[obra] ?? obra,
          fecha,
          hora,
          volumen: vol,
          comentarios: comentarios.trim(),
          vaciado: tipoVaciado,
          resistenciaKg,
          cotizacionTotal: total,
        }),
      });

      datosWaPendientes.current = {
        total,
        resistencia: labelResistenciaKg(resistenciaKg),
        vaciado: tipoVaciado === "bombeo" ? "Bombeo" : "Tiro directo",
        vol,
      };
      setMensajePagoAbierto(true);
    } catch (e) {
      setErrorReserva(e instanceof Error ? e.message : "Error al reservar");
    } finally {
      setReservando(false);
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
            onClick={cerrarModal}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="cotizacion-modal-scroll relative w-full max-w-lg max-h-[min(92vh,40rem)] overflow-y-auto rounded-2xl border-2 border-[#c62828]/40 bg-[#141922] p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={mensajePagoAbierto ? "mensaje-pago-titulo" : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {mensajePagoAbierto ? (
              <div className="text-center py-2 sm:py-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#c62828]/20">
                  <CheckCircle2 className="h-9 w-9 text-[#86efac]" aria-hidden />
                </div>
                <h3
                  id="mensaje-pago-titulo"
                  className="font-display text-xl font-bold text-white tracking-wide sm:text-2xl mb-3"
                >
                  Pedido registrado
                </h3>
                <p className="text-sm leading-relaxed text-[#cbd5e1] mb-6 text-left sm:text-center">
                  Tu reserva quedó guardada. Tienes un máximo de{" "}
                  <span className="text-white font-semibold">2 horas</span> para realizar el pago y enviar el
                  comprobante por WhatsApp. Si no recibimos el comprobante en ese plazo, el horario dejará de estar
                  reservado y volverá a estar libre.
                </p>
                <button
                  type="button"
                  onClick={confirmarMensajePagoYWhatsApp}
                  className="w-full sm:w-auto min-w-[200px] py-3.5 px-6 rounded-lg bg-[#c62828] hover:bg-[#e53935] text-white font-display font-bold uppercase tracking-wide text-sm transition-colors"
                >
                  Entendido, continuar a WhatsApp
                </button>
              </div>
            ) : (
              <>
            <div className="flex justify-between items-start gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#c62828] font-semibold mb-1">
                  Paso {step} de 2
                </p>
                <h3 className="font-display text-xl font-bold text-white tracking-wide sm:text-2xl">
                  {step === 1 ? "Cotizar" : "Agenda y reserva"}
                </h3>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X size={24} className="text-[#94a3b8]" />
              </button>
            </div>

            {step === 1 && (
              <>
                <Cotizador
                  cotizacion={cotizacion}
                  resistenciaKg={resistenciaKg}
                  setResistenciaKg={setResistenciaKg}
                  loading={loadingSheet}
                  error={loadErr}
                  tipoVaciado={tipoVaciado}
                  setTipoVaciado={setTipoVaciado}
                  volumen={volumen}
                  setVolumen={setVolumen}
                  totalEstimado={totalEstimado}
                />
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={!puedeAvanzar}
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#c62828] hover:bg-[#e53935] disabled:opacity-45 text-white font-semibold uppercase text-sm"
                  >
                    Siguiente: fecha y hora
                    <ChevronRight size={20} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mb-4 inline-flex items-center gap-1 text-sm text-[#94a3b8] hover:text-white"
                >
                  <ChevronLeft size={18} />
                  Volver a cotización
                </button>
                <AgendaSelector
                  nombre={nombre}
                  setNombre={setNombre}
                  empresa={empresa}
                  setEmpresa={setEmpresa}
                  obra={obra}
                  setObra={setObra}
                  fecha={fecha}
                  setFecha={setFecha}
                  hora={hora}
                  setHora={setHora}
                  volumen={volumen}
                  setVolumen={setVolumen}
                  comentarios={comentarios}
                  setComentarios={setComentarios}
                  capacidadMaximaHora={capacidadMaximaHora}
                  onSubmitReserva={handleReservar}
                  reservando={reservando}
                  errorReserva={errorReserva}
                />
              </>
            )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
