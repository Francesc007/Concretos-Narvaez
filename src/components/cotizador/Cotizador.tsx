import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { CotizacionPreciosConfig } from "@/types/sheets";
import {
  MENSAJE_COTIZACION_ASESOR,
  MENSAJE_INFORMATIVO_BOMBEO_PENDIENTE,
  volumenMaximoCotizadorM3,
  labelResistenciaKg,
  labelZona,
  resistenciasCotizacion,
  resistenciaRapidaDesdeSeleccion,
  VOLUMEN_MINIMO_OLLA_M3,
  type ResistenciaKg,
  type CotizacionDinamicaResultado,
  type TipoBombaCotizador,
} from "@/lib/cotizacion";
import type { AditivoCotizacion, ResistenciaRapidaDias, ZonaCotizacion } from "@/types/sheets";

type GooglePlace = {
  fetchFields: (opts: { fields: string[] }) => Promise<void>;
  formattedAddress?: string;
  displayName?: string;
};

type PlacePrediction = {
  text?: { toString: () => string } | string;
  toPlace: () => GooglePlace;
};

type PlaceAutocompleteSuggestion = {
  placePrediction?: PlacePrediction;
};

type PlacesLibrary = {
  AutocompleteSuggestion?: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      includedRegionCodes?: string[];
    }) => Promise<{ suggestions: PlaceAutocompleteSuggestion[] }>;
  };
};

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      importLibrary?: (name: string) => Promise<PlacesLibrary>;
    };
  };
  __googleMapsPlacesPromise?: Promise<void>;
};

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Catálogo MR solo informativo en la tarjeta (no afecta precios ni envíos). */
const RESISTENCIA_MR_OPCIONES = [
  "MR 35",
  "MR 36",
  "MR 38",
  "MR 40",
  "MR 42",
  "MR 45",
  "MR 48",
  "MR 50",
] as const;

function getGoogleMapsWindow() {
  return window as GoogleMapsWindow;
}

function loadGoogleMapsPlaces(apiKey: string | undefined) {
  if (typeof window === "undefined") return Promise.resolve();

  const mapsWindow = getGoogleMapsWindow();
  if (!apiKey) return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está definida."));
  if (mapsWindow.__googleMapsPlacesPromise) return mapsWindow.__googleMapsPlacesPromise;

  const finish = async () => {
    const maps = mapsWindow.google?.maps;
    if (!maps?.importLibrary) throw new Error("Google Maps API incompleta.");
    const placesLib = await maps.importLibrary("places");
    if (!placesLib.AutocompleteSuggestion) {
      throw new Error("AutocompleteSuggestion no está disponible.");
    }
  };

  mapsWindow.__googleMapsPlacesPromise = (async () => {
    if (mapsWindow.google?.maps?.importLibrary) {
      await finish();
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
      const script = existingScript ?? document.createElement("script");

      const done = () => {
        void finish().then(resolve).catch(reject);
      };

      script.addEventListener("load", done, { once: true });
      script.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")), { once: true });

      if (!existingScript) {
        script.id = GOOGLE_MAPS_SCRIPT_ID;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places&language=es`;
        script.async = true;
        document.head.appendChild(script);
      } else if (mapsWindow.google?.maps?.importLibrary) {
        done();
      }
    });
  })();

  return mapsWindow.__googleMapsPlacesPromise;
}

export interface CotizadorProps {
  cotizacion: CotizacionPreciosConfig | null;
  resistenciaKg: ResistenciaKg;
  setResistenciaKg: (v: ResistenciaKg) => void;
  loading: boolean;
  error: string | null;
  tipoVaciado: "tiro_directo" | "bombeo";
  setTipoVaciado: (v: "tiro_directo" | "bombeo") => void;
  tipoBomba: TipoBombaCotizador;
  setTipoBomba: (v: TipoBombaCotizador) => void;
  volumen: string;
  setVolumen: (v: string) => void;
  destinoObra: string;
  setDestinoObra: (v: string) => void;
  distanciaObra: {
    destino: string;
    distanceKm: number;
    distanceText: string;
    durationText: string | null;
    zona: ZonaCotizacion | null;
    zonaLabel: string;
    bloqueado: boolean;
    mensaje: string | null;
  } | null;
  calcularDistanciaObra: () => void;
  calculandoDistancia: boolean;
  errorDistancia: string | null;
  aditivos: Record<AditivoCotizacion, boolean>;
  setAditivos: (v: Record<AditivoCotizacion, boolean>) => void;
  resistenciaRapidaDias: "" | ResistenciaRapidaDias;
  setResistenciaRapidaDias: (v: "" | ResistenciaRapidaDias) => void;
  cotizacionResultado: CotizacionDinamicaResultado;
}

function labelTipoSheet(t: "tiro_directo" | "bombeo") {
  return t === "bombeo" ? "Bombeo" : "Tiro Directo";
}

function getSuggestionText(suggestion: PlaceAutocompleteSuggestion) {
  const text = suggestion.placePrediction?.text;
  return typeof text === "string" ? text : text?.toString() ?? "";
}

export function Cotizador({
  cotizacion,
  resistenciaKg,
  setResistenciaKg,
  loading,
  error,
  tipoVaciado,
  setTipoVaciado,
  tipoBomba,
  setTipoBomba,
  volumen,
  setVolumen,
  destinoObra,
  setDestinoObra,
  distanciaObra,
  calcularDistanciaObra,
  calculandoDistancia,
  errorDistancia,
  aditivos,
  setAditivos,
  resistenciaRapidaDias,
  setResistenciaRapidaDias,
  cotizacionResultado,
}: CotizadorProps) {
  const destinoObraRef = useRef(destinoObra);
  const setDestinoObraRef = useRef(setDestinoObra);
  const suggestionsRequestIdRef = useRef(0);
  const [destinoSuggestions, setDestinoSuggestions] = useState<PlaceAutocompleteSuggestion[]>([]);
  const [mostrarDestinoSuggestions, setMostrarDestinoSuggestions] = useState(false);
  const [mrLeyendaAbierta, setMrLeyendaAbierta] = useState(false);
  const vol = parseFloat(volumen.replace(",", ".")) || 0;
  const avisoCargoVacio = vol > 0 && vol < VOLUMEN_MINIMO_OLLA_M3;
  const volMaxUi = volumenMaximoCotizadorM3(cotizacion);
  const leyendaVolumenExcedido = !!cotizacion && vol > volMaxUi;
  const precioM3 = cotizacionResultado.precioM3;
  const totalEstimado = cotizacionResultado.total;
  const totalExcluyeBombeo = cotizacionResultado.totalExcluyeBombeo;
  const fmtTotal = (n: number) =>
    `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const resistenciasDisponibles = resistenciasCotizacion(cotizacion);

  useEffect(() => {
    setDestinoObraRef.current = setDestinoObra;
  }, [setDestinoObra]);

  useEffect(() => {
    destinoObraRef.current = destinoObra;
  }, [destinoObra]);

  useEffect(() => {
    const input = destinoObra.trim();
    const requestId = suggestionsRequestIdRef.current + 1;
    suggestionsRequestIdRef.current = requestId;

    if (input.length < 3) {
      setDestinoSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadGoogleMapsPlaces(GOOGLE_MAPS_API_KEY)
        .then(async () => {
        const maps = getGoogleMapsWindow().google?.maps;
        if (!maps?.importLibrary) return;

          const placesLib = await maps.importLibrary("places");
          const response = await placesLib.AutocompleteSuggestion?.fetchAutocompleteSuggestions({
            input,
            includedRegionCodes: ["mx"],
          });

          if (requestId === suggestionsRequestIdRef.current) {
            setDestinoSuggestions(response?.suggestions ?? []);
          }
        })
        .catch(() => {
          if (requestId === suggestionsRequestIdRef.current) setDestinoSuggestions([]);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [destinoObra]);

  async function seleccionarDestinoSuggestion(suggestion: PlaceAutocompleteSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "displayName"] });
      const seleccion = place.formattedAddress ?? place.displayName ?? getSuggestionText(suggestion);
      if (seleccion) setDestinoObraRef.current(seleccion);
    } catch {
      const fallback = getSuggestionText(suggestion);
      if (fallback) setDestinoObraRef.current(fallback);
    } finally {
      setMostrarDestinoSuggestions(false);
      setDestinoSuggestions([]);
    }
  }

  function toggleAditivo(key: AditivoCotizacion) {
    setAditivos({ ...aditivos, [key]: !aditivos[key] });
  }

  return (
    <div className="space-y-5">
      <h4 className="font-display text-lg font-semibold tracking-wide text-[var(--tepexi-logo-navy)]">
        Cotización en tiempo real
      </h4>
      {loading && <p className="text-sm text-slate-600">Cargando precios desde la tabla…</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div>
        <label htmlFor="cotiz-destino" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
          Ubicación de la obra
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              id="cotiz-destino"
              value={destinoObra}
              onChange={(e) => {
                setDestinoObra(e.target.value);
                setMostrarDestinoSuggestions(true);
              }}
              onFocus={() => setMostrarDestinoSuggestions(true)}
              onBlur={() => window.setTimeout(() => setMostrarDestinoSuggestions(false), 120)}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
              placeholder="Ej. colonia, municipio o dirección de la obra"
            />
            {mostrarDestinoSuggestions && destinoSuggestions.length > 0 && (
              <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {destinoSuggestions.map((suggestion, idx) => {
                  const label = getSuggestionText(suggestion);
                  if (!label) return null;

                  return (
                    <button
                      key={`${label}-${idx}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void seleccionarDestinoSuggestion(suggestion)}
                      className="block w-full px-4 py-3 text-left text-sm text-[var(--tepexi-logo-navy)] transition-colors hover:bg-slate-50"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={calcularDistanciaObra}
            disabled={calculandoDistancia || !destinoObra.trim()}
            className="rounded-lg bg-[var(--tepexi-logo-navy)] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-45"
          >
            {calculandoDistancia ? "Calculando..." : "Calcular zona"}
          </button>
        </div>
        {distanciaObra && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm text-slate-700">
            <p>
              Ruta: <span className="font-medium text-[var(--tepexi-logo-navy)]">{distanciaObra.distanceText}</span>
              {distanciaObra.durationText ? ` · ${distanciaObra.durationText}` : ""} ·{" "}
              <span className="font-semibold text-emerald-800">
                {distanciaObra.zona ? distanciaObra.zonaLabel : labelZona(null)}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{distanciaObra.destino}</p>
          </div>
        )}
        {errorDistancia && (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorDistancia}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cotiz-resistencia" className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">
            Resistencia f&apos;c
          </label>
          <select
            id="cotiz-resistencia"
            value={resistenciaKg}
            onChange={(e) => setResistenciaKg(Number(e.target.value) as ResistenciaKg)}
            disabled={!cotizacion}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20 disabled:opacity-50"
          >
            {resistenciasDisponibles.map((kg) => (
              <option key={kg} value={kg}>
                {labelResistenciaKg(kg)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)] select-none text-transparent"
            aria-hidden="true"
          >
            Resistencia f&apos;c
          </label>
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-none transition-[box-shadow] focus-within:ring-2 focus-within:ring-[#c62828]/20 focus-within:ring-offset-0">
            <button
              type="button"
              id="cotiz-resistencia-mr"
              aria-expanded={mrLeyendaAbierta ? "true" : "false"}
              aria-controls="cotiz-resistencia-mr-panel"
              onClick={() => setMrLeyendaAbierta((o) => !o)}
              className="w-full border-0 bg-transparent px-4 py-3 text-left text-sm font-medium text-[var(--tepexi-logo-navy)] outline-none transition hover:bg-slate-50/80 focus-visible:bg-slate-50/80"
            >
              Resistencia MR
            </button>
            {mrLeyendaAbierta && (
              <div
                id="cotiz-resistencia-mr-panel"
                className="flex gap-2 border-t border-amber-200/90 bg-amber-50/95 px-3 py-3"
                role="region"
                aria-label="Información resistencia MR"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#c62828]" aria-hidden />
                <div className="min-w-0 text-xs leading-relaxed text-amber-950/90">
                  <p>
                    <span className="font-semibold text-[var(--tepexi-logo-navy)]">
                      {RESISTENCIA_MR_OPCIONES.join(", ")}
                    </span>
                    .
                  </p>
                  <p className="mt-1.5">
                    Para cotizar este tipo de concreto comunícate con un asesor por Teléfono o por WhatsApp.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">Tiro directo o bombeo</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTipoVaciado("tiro_directo")}
            className={`flex-1 py-3 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-colors ${
              tipoVaciado === "tiro_directo"
                ? "border-2 border-[#c62828] bg-[#fef2f2] text-[var(--tepexi-logo-navy)]"
                : "border border-slate-200 text-[var(--tepexi-logo-navy)] hover:bg-slate-50"
            }`}
          >
            {labelTipoSheet("tiro_directo")}
          </button>
          <button
            type="button"
            onClick={() => setTipoVaciado("bombeo")}
            className={`flex-1 py-3 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-colors ${
              tipoVaciado === "bombeo"
                ? "border-2 border-[#c62828] bg-[#fef2f2] text-[var(--tepexi-logo-navy)]"
                : "border border-slate-200 text-[var(--tepexi-logo-navy)] hover:bg-slate-50"
            }`}
          >
            {labelTipoSheet("bombeo")}
          </button>
        </div>
        {tipoVaciado === "bombeo" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-[var(--tepexi-text-body)]">Tipo de bombeo</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => setTipoBomba("estacionaria")}
                className={`flex-1 py-2.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  tipoBomba === "estacionaria"
                    ? "border-2 border-[#c62828] bg-[#fef2f2] text-[var(--tepexi-logo-navy)]"
                    : "border border-slate-200 text-[var(--tepexi-logo-navy)] hover:bg-slate-50"
                }`}
              >
                Bomba Estacionaria
              </button>
              <button
                type="button"
                onClick={() => setTipoBomba("pluma")}
                className={`flex-1 py-2.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  tipoBomba === "pluma"
                    ? "border-2 border-[#c62828] bg-[#fef2f2] text-[var(--tepexi-logo-navy)]"
                    : "border border-slate-200 text-[var(--tepexi-logo-navy)] hover:bg-slate-50"
                }`}
              >
                Bomba Pluma
              </button>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {tipoVaciado === "bombeo"
            ? "El subtotal muestra solo concreto a precio de tiro directo; el bombeo lo integrará un asesor."
            : "Precio estimado para tiro directo según zona y resistencia."}
        </p>
      </div>

      {tipoVaciado === "bombeo" && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/95 px-3 py-3 text-sm text-slate-800 shadow-sm">
          <div className="flex gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0c4a6e]" aria-hidden />
            <p className="min-w-0 leading-relaxed">{MENSAJE_INFORMATIVO_BOMBEO_PENDIENTE}</p>
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--tepexi-text-body)]">Volumen (m³)</label>
        {cotizacion && (
          <p className="mb-2 text-xs text-slate-500">Límite en línea: {volMaxUi} m³; por encima, cotización con asesor.</p>
        )}
        <input
          inputMode="decimal"
          value={volumen}
          onChange={(e) => setVolumen(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] placeholder:text-slate-400 outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
          placeholder="Ej. 12"
        />
        {avisoCargoVacio && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            <p className="leading-relaxed">
              Si el pedido es menor a 5 m³, se cobrará un cargo por vacío de{" "}
              <span className="font-semibold tabular-nums text-amber-900">$600 MXN</span> por m³ faltante.
            </p>
          </div>
        )}
        {leyendaVolumenExcedido && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            <p className="leading-relaxed">{MENSAJE_COTIZACION_ASESOR}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--tepexi-text-body)]">Aditivos y resistencias rápidas</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => toggleAditivo("fibra")}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              aditivos.fibra
                ? "border-2 border-[#c62828] bg-[#fef2f2] text-[var(--tepexi-logo-navy)]"
                : "border border-slate-200 text-[var(--tepexi-logo-navy)] hover:bg-slate-50"
            }`}
          >
            Fibra de polipropileno
          </button>
          <button
            type="button"
            onClick={() => toggleAditivo("impermeabilizante")}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              aditivos.impermeabilizante
                ? "border-2 border-[#c62828] bg-[#fef2f2] text-[var(--tepexi-logo-navy)]"
                : "border border-slate-200 text-[var(--tepexi-logo-navy)] hover:bg-slate-50"
            }`}
          >
            Impermeabilizante integral
          </button>
        </div>
        <select
          aria-label="Resistencia rápida"
          value={resistenciaRapidaDesdeSeleccion(resistenciaRapidaDias) ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setResistenciaRapidaDias("");
              return;
            }
            const n = Number(raw);
            if (n === 3 || n === 7 || n === 14) setResistenciaRapidaDias(n);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[var(--tepexi-logo-navy)] outline-none transition focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20"
        >
          <option value="">Resistencia normal a 28 días</option>
          <option value={14}>Resistencia rápida a 14 días</option>
          <option value={7}>Resistencia rápida a 7 días</option>
          <option value={3}>Resistencia rápida a 3 días</option>
        </select>
        {resistenciaKg < 200 && resistenciaRapidaDesdeSeleccion(resistenciaRapidaDias) != null && (
          <p className="text-xs text-red-700">Las resistencias rápidas solo aplican con f&apos;c ≥ 200 kg/cm².</p>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Desglose</p>
        {cotizacion && precioM3 > 0 && vol > 0 && cotizacionResultado.lineas.length === 0 && (
          <p className="text-sm text-slate-600">Calculando conceptos...</p>
        )}
        {cotizacionResultado.lineas.map((linea) => (
          <div key={`${linea.concepto}-${linea.importe}`} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="text-[var(--tepexi-logo-navy)]">{linea.concepto}</p>
              {linea.detalle && <p className="text-xs text-slate-500">{linea.detalle}</p>}
            </div>
            <p className="shrink-0 font-medium tabular-nums text-[var(--tepexi-logo-navy)]">
              ${linea.importe.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
        {tipoVaciado === "bombeo" && vol > 0 && (
          <p className="text-sm text-slate-600">
            Tipo de bombeo:{" "}
            <span className="font-medium text-[var(--tepexi-logo-navy)]">
              {tipoBomba === "pluma" ? "Bomba Pluma" : "Bomba Estacionaria"}
            </span>
          </p>
        )}
        {cotizacionResultado.motivosBloqueo.map((motivo) => (
          <p key={motivo} className="text-sm text-red-700">
            {motivo}
          </p>
        ))}
        <div className="mt-2 border-t border-slate-200 pt-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Total estimado</p>
          {totalExcluyeBombeo && Number.isFinite(totalEstimado) && totalEstimado > 0 ? (
            <p className="font-display text-lg font-bold leading-snug text-[#c62828] sm:text-xl md:text-2xl">
              {fmtTotal(totalEstimado)}{" "}
              <span className="font-semibold text-slate-700">(Solo concreto)</span>{" "}
              <span className="font-bold text-[#c62828]">+ Bombeo a cotizar</span>
            </p>
          ) : (
            <p className="font-display text-2xl font-bold text-[#c62828]">
              {Number.isFinite(totalEstimado) && totalEstimado > 0 ? fmtTotal(totalEstimado) : "—"}
            </p>
          )}
        </div>
        <p className="text-xs text-slate-500">Revisa y ajusta antes de continuar.</p>
      </div>
    </div>
  );
}
