import { useEffect, useRef, useState } from "react";
import type { CotizacionPreciosConfig } from "@/types/sheets";
import {
  TUBERIA_INCLUIDA_M,
  TUBERIA_MAXIMA_AUTOMATICA_M,
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
  metrosTuberia: string;
  setMetrosTuberia: (v: string) => void;
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
  metrosTuberia,
  setMetrosTuberia,
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
  const vol = parseFloat(volumen.replace(",", ".")) || 0;
  const avisoCargoVacio = vol > 0 && vol < VOLUMEN_MINIMO_OLLA_M3;
  const precioM3 = cotizacionResultado.precioM3;
  const totalEstimado = cotizacionResultado.total;
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
      <h4 className="font-display text-lg font-semibold text-white tracking-wide">Cotización en tiempo real</h4>
      {loading && <p className="text-sm text-[#d8e3ee]">Cargando precios desde la tabla…</p>}
      {error && (
        <p className="text-sm text-red-300 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2">{error}</p>
      )}

      <div>
        <label htmlFor="cotiz-destino" className="block text-sm font-medium text-[#ecf0f6] mb-2">
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
              className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
              placeholder="Ej. colonia, municipio o dirección de la obra"
            />
            {mostrarDestinoSuggestions && destinoSuggestions.length > 0 && (
              <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[#cfd8e4]/25 bg-[#0c0f14] shadow-xl">
                {destinoSuggestions.map((suggestion, idx) => {
                  const label = getSuggestionText(suggestion);
                  if (!label) return null;

                  return (
                    <button
                      key={`${label}-${idx}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void seleccionarDestinoSuggestion(suggestion)}
                      className="block w-full px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
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
            className="rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/15 disabled:opacity-45"
          >
            {calculandoDistancia ? "Calculando..." : "Calcular zona"}
          </button>
        </div>
        {distanciaObra && (
          <div className="mt-3 rounded-lg border border-[#86efac]/35 bg-[#052e1a]/35 px-3 py-2 text-sm text-[#d8e3ee]">
            <p>
              Ruta: <span className="text-white">{distanciaObra.distanceText}</span>
              {distanciaObra.durationText ? ` · ${distanciaObra.durationText}` : ""} ·{" "}
              <span className="text-[#86efac]">{distanciaObra.zona ? distanciaObra.zonaLabel : labelZona(null)}</span>
            </p>
            <p className="mt-1 text-xs text-[#b0bcc9]">{distanciaObra.destino}</p>
          </div>
        )}
        {errorDistancia && (
          <p className="mt-2 text-sm text-red-300 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2">
            {errorDistancia}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cotiz-resistencia" className="block text-sm font-medium text-[#ecf0f6] mb-2">
          Resistencia f&apos;c
        </label>
        <select
          id="cotiz-resistencia"
          value={resistenciaKg}
          onChange={(e) => setResistenciaKg(Number(e.target.value) as ResistenciaKg)}
          disabled={!cotizacion}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
        >
          {resistenciasDisponibles.map((kg) => (
            <option key={kg} value={kg}>
              {labelResistenciaKg(kg)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#ecf0f6] mb-2">Tiro directo o bombeo</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTipoVaciado("tiro_directo")}
            className={`flex-1 py-3 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-colors ${
              tipoVaciado === "tiro_directo"
                ? "border-[#c62828] bg-[#c62828]/20 text-white"
                : "border-[#cfd8e4]/30 text-[#ecf0f6] hover:bg-white/5"
            }`}
          >
            {labelTipoSheet("tiro_directo")}
          </button>
          <button
            type="button"
            onClick={() => setTipoVaciado("bombeo")}
            className={`flex-1 py-3 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-colors ${
              tipoVaciado === "bombeo"
                ? "border-[#c62828] bg-[#c62828]/20 text-white"
                : "border-[#cfd8e4]/30 text-[#ecf0f6] hover:bg-white/5"
            }`}
          >
            {labelTipoSheet("bombeo")}
          </button>
        </div>
        {tipoVaciado === "bombeo" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-[#ecf0f6]">Tipo de bombeo</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => setTipoBomba("estacionaria")}
                className={`flex-1 py-2.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  tipoBomba === "estacionaria"
                    ? "border-[#c62828] bg-[#c62828]/20 text-white"
                    : "border-[#cfd8e4]/30 text-[#ecf0f6] hover:bg-white/5"
                }`}
              >
                Bomba Estacionaria
              </button>
              <button
                type="button"
                onClick={() => setTipoBomba("pluma")}
                className={`flex-1 py-2.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  tipoBomba === "pluma"
                    ? "border-[#c62828] bg-[#c62828]/20 text-white"
                    : "border-[#cfd8e4]/30 text-[#ecf0f6] hover:bg-white/5"
                }`}
              >
                Bomba Pluma
              </button>
            </div>
          </div>
        )}
        <p className="text-xs text-[#b0bcc9] mt-2">
          Los mínimos de bombeo se aplican automáticamente por zona de entrega.
        </p>
      </div>

      {tipoVaciado === "bombeo" && tipoBomba === "estacionaria" && (
        <div>
          <label className="block text-sm font-medium text-[#ecf0f6] mb-2">
            Metros de tubería estacionaria
          </label>
          <input
            inputMode="decimal"
            value={metrosTuberia}
            onChange={(e) => setMetrosTuberia(e.target.value)}
            className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
            placeholder="Ej. 30"
          />
          <p className="mt-2 text-xs text-[#b0bcc9]">
            Incluye {TUBERIA_INCLUIDA_M} m. Más de {TUBERIA_MAXIMA_AUTOMATICA_M} m requiere asesor.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#ecf0f6] mb-2">Volumen (m³)</label>
        <input
          inputMode="decimal"
          value={volumen}
          onChange={(e) => setVolumen(e.target.value)}
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white placeholder:text-[#b0bcc9] focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
          placeholder="Ej. 12"
        />
        {avisoCargoVacio && (
          <div className="mt-3 rounded-lg border border-amber-500/45 bg-amber-950/35 px-3 py-2.5 text-sm text-amber-50/95">
            <p className="text-amber-50/95 leading-relaxed">
              Si el pedido es menor a 5 m³, se cobrará un cargo por vacío de{" "}
              <span className="text-amber-100 font-semibold tabular-nums">$600 MXN</span> por m³ faltante.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#ecf0f6]">Aditivos y resistencias rápidas</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => toggleAditivo("fibra")}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              aditivos.fibra
                ? "border-[#c62828] bg-[#c62828]/20 text-white"
                : "border-[#cfd8e4]/30 text-[#ecf0f6] hover:bg-white/5"
            }`}
          >
            Fibra de polipropileno
          </button>
          <button
            type="button"
            onClick={() => toggleAditivo("impermeabilizante")}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              aditivos.impermeabilizante
                ? "border-[#c62828] bg-[#c62828]/20 text-white"
                : "border-[#cfd8e4]/30 text-[#ecf0f6] hover:bg-white/5"
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
          className="w-full py-3 px-4 bg-[#0c0f14] border border-[#cfd8e4]/25 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c62828]/60"
        >
          <option value="">Resistencia normal a 28 días</option>
          <option value={14}>Resistencia rápida a 14 días</option>
          <option value={7}>Resistencia rápida a 7 días</option>
          <option value={3}>Resistencia rápida a 3 días</option>
        </select>
        {resistenciaKg < 200 && resistenciaRapidaDesdeSeleccion(resistenciaRapidaDias) != null && (
          <p className="text-xs text-red-300">Las resistencias rápidas solo aplican con f&apos;c ≥ 200 kg/cm².</p>
        )}
      </div>

      <div className="rounded-xl border border-[#78716c]/40 bg-[#0c0f14]/80 px-4 py-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-[#d8e3ee] mb-1">Desglose</p>
        {cotizacion && precioM3 > 0 && vol > 0 && cotizacionResultado.lineas.length === 0 && (
          <p className="text-sm text-[#ecf0f6]">Calculando conceptos...</p>
        )}
        {cotizacionResultado.lineas.map((linea) => (
          <div key={`${linea.concepto}-${linea.importe}`} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="text-[#ecf0f6]">{linea.concepto}</p>
              {linea.detalle && <p className="text-xs text-[#b0bcc9]">{linea.detalle}</p>}
            </div>
            <p className="shrink-0 text-white">${linea.importe.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </div>
        ))}
        {tipoVaciado === "bombeo" && vol > 0 && (
          <p className="text-sm text-[#d8e3ee]">
            Tipo de bombeo:{" "}
            <span className="text-[#ecf0f6]">
              {tipoBomba === "pluma" ? "Bomba Pluma" : "Bomba Estacionaria"}
            </span>
          </p>
        )}
        {cotizacionResultado.motivosBloqueo.map((motivo) => (
          <p key={motivo} className="text-sm text-red-300">
            {motivo}
          </p>
        ))}
        <div className="border-t border-[#78716c]/30 pt-2 mt-2">
          <p className="text-xs uppercase tracking-wide text-[#d8e3ee] mb-1">Total estimado</p>
          <p className="font-display text-2xl font-bold text-[#ffe8eb]">
            {Number.isFinite(totalEstimado) && totalEstimado > 0
              ? `$${totalEstimado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </p>
        </div>
        <p className="text-xs text-[#b0bcc9]">Revisa y ajusta antes de continuar.</p>
      </div>
    </div>
  );
}
