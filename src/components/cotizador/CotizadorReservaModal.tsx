"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, CheckCircle2, Phone } from "lucide-react";
import { CONFIG } from "@/config";
import { apiUrl, fetchApiJson } from "@/lib/api";
import {
  calcularCotizacionDinamica,
  cotizacionTieneAlgunPrecio,
  labelResistenciaKg,
  labelVaciadoCliente,
  resistenciasCotizacion,
  vaciadoApiDesdeSeleccion,
  resistenciaRapidaDesdeSeleccion,
  volumenMaximoCotizadorM3,
  volumenM3DesdeCampoTexto,
  type CotizacionDinamicaResultado,
  type ResistenciaKg,
  type TipoBombaCotizador,
} from "@/lib/cotizacion";
import type { AditivoCotizacion, CotizacionPreciosConfig, PrecioRow, ResistenciaRapidaDias, ZonaCotizacion } from "@/types/sheets";
import { buildAgendaHoursForDate, nextAllowedAgendaDateYmd, validateAgendaSlot } from "@/lib/agendaRules";
import { Cotizador } from "./Cotizador";
import { AgendaSelector } from "./AgendaSelector";

const OBRA_LABELS: Record<string, string> = {
  residencial: "Particular",
  comercial: "Residencial",
  infraestructura: "Comercial / industrial",
};

/** Mismo formato que Footer / botón flotante (api.whatsapp.com + solo dígitos en phone). */
function openWhatsAppSend(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const url = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

interface MapsDistanceInfo {
  destino: string;
  distanceKm: number;
  distanceText: string;
  durationText: string | null;
  zona: ZonaCotizacion | null;
  zonaLabel: string;
  bloqueado: boolean;
  mensaje: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Al abrir el modal, rellena el volumen (m³) en el paso 1. */
  volumenInicialM3?: number | null;
}

/** Reactivar agenda y reservas: `CONFIG.cotizadorAgendaActiva = true` en `src/config.ts`. */
export function CotizadorReservaModal({ isOpen, onClose, volumenInicialM3 = null }: Props) {
  const agendaActiva = CONFIG.cotizadorAgendaActiva;
  const [step, setStep] = useState<1 | 2>(1);
  const [cotizacion, setCotizacion] = useState<CotizacionPreciosConfig | null>(null);
  const [capacidadMaximaHora, setCapacidadMaximaHora] = useState(50);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);

  const [resistenciaKg, setResistenciaKg] = useState<ResistenciaKg>(250);
  const [tipoVaciado, setTipoVaciado] = useState<"tiro_directo" | "bombeo">("tiro_directo");
  const [tipoBomba, setTipoBomba] = useState<TipoBombaCotizador>("estacionaria");
  const [volumen, setVolumen] = useState("");
  const [destinoObra, setDestinoObra] = useState("");
  const [distanciaObra, setDistanciaObra] = useState<MapsDistanceInfo | null>(null);
  const [calculandoDistancia, setCalculandoDistancia] = useState(false);
  const [errorDistancia, setErrorDistancia] = useState<string | null>(null);
  const [aditivos, setAditivos] = useState<Record<AditivoCotizacion, boolean>>({
    fibra: false,
    impermeabilizante: false,
  });
  const [resistenciaRapidaDias, setResistenciaRapidaDias] = useState<"" | ResistenciaRapidaDias>("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [obra, setObra] = useState("residencial");
  const [fecha, setFecha] = useState(() => nextAllowedAgendaDateYmd());
  const [hora, setHora] = useState(() => buildAgendaHoursForDate(nextAllowedAgendaDateYmd())[0] ?? "06:00");
  const [comentarios, setComentarios] = useState("");

  const [reservando, setReservando] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [mensajePagoAbierto, setMensajePagoAbierto] = useState(false);
  const [errorLeadSheets, setErrorLeadSheets] = useState<string | null>(null);
  const [enviandoLeadSheets, setEnviandoLeadSheets] = useState(false);
  /** Tras guardar bien en «Cotizaciones», no repetir fila si usa WA y luego teléfono. */
  const leadSheetsGuardadoOkRef = useRef(false);
  const guardandoLeadSheetsRef = useRef(false);
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
    leadSheetsGuardadoOkRef.current = false;
    setErrorLeadSheets(null);
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
            'No hay precios configurados en la hoja "Precios Concreto" para las zonas y servicios del cotizador.',
          );
        }
        const resistencias = resistenciasCotizacion(j1.cotizacion);
        setResistenciaKg((prev) => (resistencias.length > 0 && !resistencias.includes(prev) ? resistencias[0] : prev));
        setCapacidadMaximaHora(Number(j2.capacidadMaximaHora) || 50);
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

  useEffect(() => {
    if (!isOpen) return;
    if (volumenInicialM3 == null) return;
    if (!Number.isFinite(volumenInicialM3) || volumenInicialM3 <= 0) return;
    const t =
      Math.round(volumenInicialM3 * 1000) / 1000;
    setVolumen(String(t));
  }, [isOpen, volumenInicialM3]);

  const volumenNumerico = useMemo(() => volumenM3DesdeCampoTexto(volumen), [volumen]);
  const diasRapidosElegidos = resistenciaRapidaDesdeSeleccion(resistenciaRapidaDias);

  useEffect(() => {
    if (resistenciaRapidaDias !== "" && resistenciaRapidaDesdeSeleccion(resistenciaRapidaDias) == null) {
      setResistenciaRapidaDias("");
    }
  }, [resistenciaRapidaDias]);
  const aditivosSeleccionados = useMemo(
    () => (Object.entries(aditivos).filter(([, activo]) => activo).map(([key]) => key) as AditivoCotizacion[]),
    [aditivos],
  );

  const cotizacionResultado = useMemo<CotizacionDinamicaResultado>(
    () =>
      calcularCotizacionDinamica(cotizacion, {
        volumen: volumenNumerico,
        resistenciaKg,
        tipoVaciado,
        tipoBomba,
        zona: distanciaObra?.zona ?? null,
        aditivos: aditivosSeleccionados,
        resistenciaRapidaDias: diasRapidosElegidos,
      }),
    [
      aditivosSeleccionados,
      cotizacion,
      diasRapidosElegidos,
      distanciaObra?.zona,
      resistenciaKg,
      tipoBomba,
      tipoVaciado,
      volumenNumerico,
    ],
  );

  const puedeAvanzar =
    volumenNumerico > 0 &&
    !!cotizacion &&
    !loadErr &&
    !!distanciaObra?.zona &&
    !distanciaObra.bloqueado &&
    !cotizacionResultado.bloqueado;

  /** Guarda lead en «Cotizaciones» solo bajo demanda (WA u oficina). */
  async function enviarLeadCotizacionASheets(): Promise<boolean> {
    if (agendaActiva || !puedeAvanzar) return false;
    if (leadSheetsGuardadoOkRef.current) return true;
    if (guardandoLeadSheetsRef.current) return false;

    const vol = volumenNumerico;
    const rutaMaps = distanciaObra
      ? `${distanciaObra.distanceText}${distanciaObra.durationText ? `, ${distanciaObra.durationText}` : ""} · ${distanciaObra.zonaLabel}`
      : "";
    const desgloseCotizacion = [
      ...cotizacionResultado.lineas.map((linea) => `${linea.concepto} $${linea.importe.toFixed(2)}`),
      tipoVaciado === "bombeo" ? "Bombeo a cotizar con asesor" : null,
    ]
      .filter(Boolean)
      .join(" | ");
    const aditivosLabel = aditivosSeleccionados
      .map((aditivo) => (aditivo === "fibra" ? "Fibra de polipropileno" : "Impermeabilizante integral"))
      .join(", ");

    guardandoLeadSheetsRef.current = true;
    setEnviandoLeadSheets(true);
    setErrorLeadSheets(null);
    try {
      await fetchApiJson<{ ok?: boolean }>(apiUrl("/api/cotizacion-lead"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumen: vol,
          vaciado: vaciadoApiDesdeSeleccion(tipoVaciado, tipoBomba),
          resistenciaKg,
          cotizacionTotal: cotizacionResultado.total,
          ubicacionObra: destinoObra.trim(),
          rutaMaps,
          zona: distanciaObra?.zonaLabel ?? "",
          distancia: distanciaObra?.distanceText ?? "",
          duracion: distanciaObra?.durationText ?? "",
          tipoBomba:
            tipoVaciado === "bombeo"
              ? tipoBomba === "pluma"
                ? "Bomba Pluma"
                : "Bomba Estacionaria"
              : "",
          aditivos: aditivosLabel,
          resistenciaRapida: diasRapidosElegidos ? `${diasRapidosElegidos} días` : "",
          precioM3: cotizacionResultado.precioM3,
          desglose: desgloseCotizacion,
        }),
      });
      leadSheetsGuardadoOkRef.current = true;
      return true;
    } catch (e) {
      setErrorLeadSheets(
        e instanceof Error
          ? e.message
          : "No se guardó la cotización en el sistema. Revisa tu conexión o inténtalo de nuevo.",
      );
      return false;
    } finally {
      guardandoLeadSheetsRef.current = false;
      setEnviandoLeadSheets(false);
    }
  }

  function resetReservaForm() {
    setNombre("");
    setTelefono("");
    setEmpresa("");
    setObra("residencial");
    const nextFecha = nextAllowedAgendaDateYmd();
    setFecha(nextFecha);
    setHora(buildAgendaHoursForDate(nextFecha)[0] ?? "06:00");
    setComentarios("");
    setVolumen("");
    setDestinoObra("");
    setDistanciaObra(null);
    setErrorDistancia(null);
    setAditivos({ fibra: false, impermeabilizante: false });
    setResistenciaRapidaDias("");
    setResistenciaKg(250);
    setTipoVaciado("tiro_directo");
    setTipoBomba("estacionaria");
    setStep(1);
    setMensajePagoAbierto(false);
    setErrorReserva(null);
    setErrorLeadSheets(null);
    datosWaPendientes.current = null;
    leadSheetsGuardadoOkRef.current = false;
  }

  async function calcularDistanciaObra() {
    setErrorDistancia(null);
    setDistanciaObra(null);
    if (!destinoObra.trim()) {
      setErrorDistancia("Escribe la ubicación de la obra para calcular la zona.");
      return;
    }
    setCalculandoDistancia(true);
    try {
      const data = await fetchApiJson<MapsDistanceInfo>(
        apiUrl(`/api/maps-distance?destino=${encodeURIComponent(destinoObra.trim())}`),
      );
      setDistanciaObra(data);
      if (data.bloqueado && data.mensaje) setErrorDistancia(data.mensaje);
    } catch (e) {
      setErrorDistancia(e instanceof Error ? e.message : "No se pudo calcular la distancia.");
    } finally {
      setCalculandoDistancia(false);
    }
  }

  function cerrarModal() {
    resetReservaForm();
    onClose();
  }

  function confirmarMensajePagoYWhatsApp() {
    const d = datosWaPendientes.current;
    if (d) abrirWhatsAppReserva(d);
    resetReservaForm();
    onClose();
  }

  const abrirWhatsAppReserva = (extra: { total: number; resistencia: string; vaciado: string; vol: number }) => {
    const rutaMaps = distanciaObra
      ? `${distanciaObra.distanceText}${distanciaObra.durationText ? `, ${distanciaObra.durationText}` : ""} · ${distanciaObra.zonaLabel}`
      : null;
    const desglose = [
      ...cotizacionResultado.lineas.map((linea) => `${linea.concepto}: $${linea.importe.toFixed(2)}`),
      tipoVaciado === "bombeo" ? "Bombeo: a cotizar con asesor" : null,
    ]
      .filter(Boolean)
      .join(" | ");
    const aditivosLabel = aditivosSeleccionados
      .map((aditivo) => (aditivo === "fibra" ? "Fibra de polipropileno" : "Impermeabilizante integral"))
      .join(", ");
    const lineas = [
      `*Reserva ${CONFIG.companyDisplayName}*`,
      `Nombre: ${nombre.trim()}`,
      `Teléfono: ${telefono.trim()}`,
      empresa.trim() ? `Empresa: ${empresa.trim()}` : null,
      `Obra: ${OBRA_LABELS[obra] ?? obra}`,
      destinoObra.trim() ? `Ubicación obra: ${destinoObra.trim()}` : null,
      rutaMaps ? `Ruta Maps: ${rutaMaps}` : null,
      `Fecha: ${fecha}  Hora: ${hora}`,
      `Volumen: ${extra.vol} m³`,
      `Resistencia: ${extra.resistencia}`,
      `Vaciado: ${extra.vaciado}`,
      aditivosLabel ? `Aditivos: ${aditivosLabel}` : null,
      diasRapidosElegidos ? `Resistencia rápida: ${diasRapidosElegidos} días` : null,
      desglose ? `Desglose: ${desglose}` : null,
      `Total estimado: $${extra.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}${tipoVaciado === "bombeo" ? " (solo concreto; bombeo a cotizar)" : ""}`,
      `Estado en agenda: Agendado`,
      comentarios.trim() ? `Comentarios: ${comentarios.trim()}` : null,
    ].filter(Boolean) as string[];
    openWhatsAppSend(CONFIG.whatsappNumber, lineas.join("\n"));
  };

  async function abrirWhatsAppCotizacionInformativa() {
    await enviarLeadCotizacionASheets();

    const vol = volumenNumerico;
    const total = cotizacionResultado.total;
    const rutaMaps = distanciaObra
      ? `${distanciaObra.distanceText}${distanciaObra.durationText ? `, ${distanciaObra.durationText}` : ""} · ${distanciaObra.zonaLabel}`
      : null;
    const desglose = [
      ...cotizacionResultado.lineas.map((linea) => `${linea.concepto}: $${linea.importe.toFixed(2)}`),
      tipoVaciado === "bombeo" ? "Bombeo: a cotizar con asesor" : null,
    ]
      .filter(Boolean)
      .join(" | ");
    const aditivosLabel = aditivosSeleccionados
      .map((aditivo) => (aditivo === "fibra" ? "Fibra de polipropileno" : "Impermeabilizante integral"))
      .join(", ");
    const lineas = [
      `*Cotización ${CONFIG.companyDisplayName}*`,
      destinoObra.trim() ? `Ubicación obra: ${destinoObra.trim()}` : null,
      rutaMaps ? `Ruta: ${rutaMaps}` : null,
      `Volumen: ${vol} m³`,
      `Resistencia: ${labelResistenciaKg(resistenciaKg)}`,
      `Vaciado: ${labelVaciadoCliente(tipoVaciado, tipoBomba)}`,
      aditivosLabel ? `Aditivos: ${aditivosLabel}` : null,
      diasRapidosElegidos ? `Resistencia rápida: ${diasRapidosElegidos} días` : null,
      desglose ? `Desglose: ${desglose}` : null,
      `Total estimado: $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}${tipoVaciado === "bombeo" ? " (solo concreto; bombeo a cotizar)" : ""}`,
      `Quiero formalizar mi pedido, agendar colado o recibir atención personalizada.`,
    ].filter(Boolean) as string[];
    openWhatsAppSend(CONFIG.whatsappNumber, lineas.join("\n"));
    resetReservaForm();
    onClose();
  }

  async function onLlamarOficina(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const ok = await enviarLeadCotizacionASheets();
    if (!ok) return;
    resetReservaForm();
    onClose();
    window.location.href = `tel:${CONFIG.landlinePhoneE164}`;
  }

  const handleReservar = async () => {
    setErrorReserva(null);
    const vol = volumenM3DesdeCampoTexto(volumen);
    if (!nombre.trim() || !telefono.trim() || vol <= 0) {
      setErrorReserva("Completa nombre, teléfono y volumen válido.");
      return;
    }
    if (!cotizacion) {
      setErrorReserva("No hay datos de cotización.");
      return;
    }
    if (cotizacionResultado.bloqueado || cotizacionResultado.total <= 0) {
      setErrorReserva(cotizacionResultado.motivosBloqueo[0] ?? "La cotización no está lista para reservar.");
      return;
    }
    const horarioError = validateAgendaSlot(fecha, hora);
    if (horarioError) {
      setErrorReserva(horarioError);
      return;
    }
    setReservando(true);
    try {
      const total = cotizacionResultado.total;
      const rutaMaps = distanciaObra
        ? `${distanciaObra.distanceText}${distanciaObra.durationText ? `, ${distanciaObra.durationText}` : ""} · ${distanciaObra.zonaLabel}`
        : "";
      const desgloseCotizacion = [
        ...cotizacionResultado.lineas.map((linea) => `${linea.concepto} $${linea.importe.toFixed(2)}`),
        tipoVaciado === "bombeo" ? "Bombeo a cotizar con asesor" : null,
      ]
        .filter(Boolean)
        .join(" | ");
      const aditivosLabel = aditivosSeleccionados
        .map((aditivo) => (aditivo === "fibra" ? "Fibra de polipropileno" : "Impermeabilizante integral"))
        .join(", ");

      await fetchApiJson<{ ok?: boolean }>(apiUrl("/api/reserve"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          empresa: empresa.trim(),
          obra: OBRA_LABELS[obra] ?? obra,
          fecha,
          hora,
          volumen: vol,
          comentarios: comentarios.trim(),
          vaciado: vaciadoApiDesdeSeleccion(tipoVaciado, tipoBomba),
          resistenciaKg,
          cotizacionTotal: total,
          ubicacionObra: destinoObra.trim(),
          rutaMaps,
          zona: distanciaObra?.zonaLabel ?? "",
          distancia: distanciaObra?.distanceText ?? "",
          duracion: distanciaObra?.durationText ?? "",
          tipoBomba:
            tipoVaciado === "bombeo"
              ? tipoBomba === "pluma"
                ? "Bomba Pluma"
                : "Bomba Estacionaria"
              : "",
          aditivos: aditivosLabel,
          resistenciaRapida: diasRapidosElegidos ? `${diasRapidosElegidos} días` : "",
          precioM3: cotizacionResultado.precioM3,
          desglose: desgloseCotizacion,
        }),
      });

      datosWaPendientes.current = {
        total,
        resistencia: labelResistenciaKg(resistenciaKg),
        vaciado: labelVaciadoCliente(tipoVaciado, tipoBomba),
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
            className="absolute inset-0 bg-black/75"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="cotizacion-modal-scroll relative w-full max-w-lg max-h-[min(92vh,40rem)] overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-[0_20px_50px_-12px_rgba(19,47,76,0.15)] ring-1 ring-slate-200/80 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={mensajePagoAbierto ? "mensaje-pago-titulo" : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {mensajePagoAbierto ? (
              <div className="py-2 text-center sm:py-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden />
                </div>
                <h3
                  id="mensaje-pago-titulo"
                  className="font-display mb-3 text-xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-2xl"
                >
                  Pedido registrado
                </h3>
                <p className="mb-6 text-left text-sm leading-relaxed text-[var(--tepexi-text-body)] sm:text-center">
                  Tu reserva quedó guardada. En unos momentos uno de nuestros Asesores se pondrá en contacto contigo para
                  dar seguimiento al servicio agendado.
                </p>
                <button
                  type="button"
                  onClick={confirmarMensajePagoYWhatsApp}
                  className="w-full min-w-[200px] rounded-lg bg-tepexi-accent px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-tepexi-accent-hover sm:w-auto"
                >
                  Entendido, continuar a WhatsApp
                </button>
              </div>
            ) : (
              <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tepexi-accent">
                  {agendaActiva ? `Paso ${step} de 2` : "Cotización en línea"}
                </p>
                <h3 className="font-display text-xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-2xl">
                  {agendaActiva ? (step === 1 ? "Cotizar" : "Agenda y reserva") : "Cotizar"}
                </h3>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[var(--tepexi-logo-navy)]"
                aria-label="Cerrar"
              >
                <X size={24} aria-hidden />
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
                  tipoBomba={tipoBomba}
                  setTipoBomba={setTipoBomba}
                  volumen={volumen}
                  setVolumen={setVolumen}
                  destinoObra={destinoObra}
                  setDestinoObra={(v) => {
                    setDestinoObra(v);
                    setDistanciaObra(null);
                    setErrorDistancia(null);
                  }}
                  distanciaObra={distanciaObra}
                  calcularDistanciaObra={calcularDistanciaObra}
                  calculandoDistancia={calculandoDistancia}
                  errorDistancia={errorDistancia}
                  aditivos={aditivos}
                  setAditivos={setAditivos}
                  resistenciaRapidaDias={resistenciaRapidaDias}
                  setResistenciaRapidaDias={setResistenciaRapidaDias}
                  cotizacionResultado={cotizacionResultado}
                />
                {!agendaActiva && puedeAvanzar && (
                  <div className="mt-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-sky-50/40 px-4 py-5 shadow-sm sm:px-5">
                    <p className="text-center text-sm font-semibold leading-relaxed text-[var(--tepexi-logo-navy)] sm:text-[0.95rem]">
                      ¡Cotización lista! Para formalizar tu pedido, agendar el colado o recibir atención personalizada,
                      contáctanos directamente:
                    </p>
                    {errorLeadSheets && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-center text-xs text-amber-900">
                        {errorLeadSheets}
                      </p>
                    )}
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                      <button
                        type="button"
                        disabled={enviandoLeadSheets}
                        onClick={() => void abrirWhatsAppCotizacionInformativa()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#20bd5a] enabled:cursor-pointer disabled:opacity-45 sm:flex-initial sm:min-w-[180px]"
                      >
                        {enviandoLeadSheets ? "Guardando…" : "WhatsApp"}
                      </button>
                      <a
                        href={`tel:${CONFIG.landlinePhoneE164}`}
                        onClick={(e) => void onLlamarOficina(e)}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[var(--tepexi-logo-navy)] bg-white px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-[var(--tepexi-logo-navy)] shadow-sm transition hover:bg-slate-50 sm:flex-initial sm:min-w-[200px] ${enviandoLeadSheets ? "pointer-events-none opacity-45" : ""}`}
                      >
                        <Phone className="h-5 w-5 shrink-0" aria-hidden />
                        Llamar a oficina
                      </a>
                    </div>
                  </div>
                )}
                {agendaActiva && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={!puedeAvanzar}
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-lg bg-tepexi-accent px-5 py-3 text-sm font-semibold uppercase text-white hover:bg-tepexi-accent-hover disabled:opacity-45"
                    >
                      Siguiente: fecha y hora
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}

            {agendaActiva && step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--tepexi-logo-navy)] transition-colors hover:text-tepexi-accent"
                >
                  <ChevronLeft size={18} />
                  Volver a cotización
                </button>
                <AgendaSelector
                  nombre={nombre}
                  setNombre={setNombre}
                  telefono={telefono}
                  setTelefono={setTelefono}
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
                  volumenMaximoCotizadorM3={volumenMaximoCotizadorM3(cotizacion)}
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
