import { buildAgendaHoursForDate } from "@/lib/agendaRules";
import type { IntervalMinutes } from "@/lib/agendaCapacity";
import {
  accumulateExistingOrders,
  buildCapPerHour,
  canScheduleVolume,
  findNextSuggestedHour,
  hourSlotTouchesBlock,
  normalizeHoraSlot,
} from "@/lib/agendaCapacity";
import {
  ensureAgendaPedidosEspejadosEnBloqueosLogistica,
  fetchBloqueosLogisticaIntervalsForDay,
  fetchCapacidadMaximaHora,
  fetchPedidosAgendaOcupanCupoParaDia,
  normalizeHora,
  syncAgendaCanceladosMotivoEnBloqueosLogistica,
} from "@/lib/googleSheets";

export type AgendaAvailabilityResult = {
  fecha: string;
  hora: string;
  capacidadMaximaHora: number;
  /** Consumo ya comprometido en esta hora tras cascada de todos los pedidos del día. */
  usadoM3: number;
  /** Capacidad remanente en esta hora (sin proyectar un nuevo pedido). */
  disponibleM3: number;
  horasBloqueadasLogistica: string[];
  /** Si se envió volumen en la petición: ¿cabe un pedido nuevo iniciando en `hora`? */
  puedeAgendar?: boolean;
  /** Siguiente hora donde cabría el mismo volumen; si null, no hay hueco ese día. */
  sugerenciaHora: string | null;
  mensajeCapacidad: string | null;
};

/**
 * Combina pedidos activos de Agenda con la cascada activa de Bloqueos_Logistica.
 * `pedidosAgenda`: solo filas cuyo Estado ocupa cupo (excluye «Cancelado» y «Disponible») — ver lectura Agenda.
 * `cascadeOrders`: solo filas con Motivo distinto de «Cancelado» — ver lectura Bloqueos_Logistica.
 * Dedup por (hora normalizada | volumen) para no doblar conteo cuando reserva web existe en ambas pestañas.
 */
function mergeOrdersConDedup(
  pedidosAgenda: readonly { hora: string; volumen: number }[],
  cascadeOrders: readonly { hora: string; volumen: number }[],
): { hora: string; volumen: number }[] {
  const key = (h: string, v: number) => `${normalizeHoraSlot(h)}|${v}`;
  const counts = new Map<string, number>();
  for (const c of cascadeOrders) {
    const k = key(c.hora, c.volumen);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const extra: { hora: string; volumen: number }[] = [];
  for (const p of pedidosAgenda) {
    const k = key(p.hora, p.volumen);
    const left = counts.get(k) ?? 0;
    if (left > 0) {
      counts.set(k, left - 1);
    } else {
      extra.push(p);
    }
  }

  return [...cascadeOrders, ...extra];
}

export async function computeAgendaAvailability(opts: {
  fecha: string;
  hora: string;
  volumen?: number;
}): Promise<AgendaAvailabilityResult> {
  const hora = normalizeHora(opts.hora);
  const hours = buildAgendaHoursForDate(opts.fecha);

  await syncAgendaCanceladosMotivoEnBloqueosLogistica(opts.fecha);
  await ensureAgendaPedidosEspejadosEnBloqueosLogistica(opts.fecha);

  const baseCap = await fetchCapacidadMaximaHora().catch(() => 50);

  const [pedidos, bloqueos] = await Promise.all([
    fetchPedidosAgendaOcupanCupoParaDia(opts.fecha),
    fetchBloqueosLogisticaIntervalsForDay(opts.fecha),
  ]);

  const caps = buildCapPerHour(hours, baseCap, bloqueos.intervals);
  const ordenes = mergeOrdersConDedup(pedidos, bloqueos.cascadeOrders);
  const used = accumulateExistingOrders(hours, caps, ordenes);

  const hSlot = normalizeHoraSlot(hora);
  const usadoM3 = used[hSlot] ?? 0;
  const disponibleM3 = Math.max(0, (caps[hSlot] ?? 0) - usadoM3);

  const horasBloqueadasLogistica = hours.filter(
    (hx) => hourSlotTouchesBlock(hx, bloqueos.intervals) || (caps[hx] ?? 0) - (used[hx] ?? 0) <= 0,
  );

  const vol =
    opts.volumen != null && Number.isFinite(opts.volumen) && opts.volumen > 0 ? opts.volumen : undefined;

  let puedeAgendar: boolean | undefined;
  let sugerenciaHora: string | null = null;
  let mensajeCapacidad: string | null = null;

  if (vol != null) {
    puedeAgendar = canScheduleVolume(used, caps, hours, hora, vol);
    if (!puedeAgendar) {
      sugerenciaHora = findNextSuggestedHour(used, caps, hours, vol);
      mensajeCapacidad = sugerenciaHora
        ? `Con ${vol} m³ no hay flujo continuo desde las ${hSlot}. Siguiente opción sugerida: ${sugerenciaHora} h.`
        : `No hay capacidad suficiente ese día para ${vol} m³ en horario laborable (revisa bloqueos y pedidos existentes).`;
    }
  }

  return {
    fecha: opts.fecha,
    hora,
    capacidadMaximaHora: baseCap,
    usadoM3,
    disponibleM3,
    horasBloqueadasLogistica,
    puedeAgendar,
    sugerenciaHora,
    mensajeCapacidad,
  };
}

/**
 * Horas que la UI puede mostrar como bloqueadas a partir de Bloqueos_Logistica.
 * Antes se ejecuta el espejo Agenda → Bloqueos para pedidos manuales sin fila en logística.
 */
export async function computeHorasBloqueadasLogistica(fechaYmd: string): Promise<string[]> {
  await syncAgendaCanceladosMotivoEnBloqueosLogistica(fechaYmd);
  await ensureAgendaPedidosEspejadosEnBloqueosLogistica(fechaYmd);
  const hours = buildAgendaHoursForDate(fechaYmd);
  if (hours.length === 0) return [];
  const bloqueos = await fetchBloqueosLogisticaIntervalsForDay(fechaYmd);
  const baseCap = await fetchCapacidadMaximaHora().catch(() => 50);
  const caps = buildCapPerHour(hours, baseCap, bloqueos.intervals);
  const used = accumulateExistingOrders(hours, caps, bloqueos.cascadeOrders);
  return hours.filter(
    (hx) => hourSlotTouchesBlock(hx, bloqueos.intervals) || (caps[hx] ?? 0) - (used[hx] ?? 0) <= 0,
  );
}

/** Expuesto para pruebas / validación en reserva sin duplicar lecturas. */
export async function loadDayCapacityContext(fecha: string): Promise<{
  hours: string[];
  baseCap: number;
  caps: Record<string, number>;
  used: Record<string, number>;
  bloqueos: IntervalMinutes[];
}> {
  const hours = buildAgendaHoursForDate(fecha);
  await syncAgendaCanceladosMotivoEnBloqueosLogistica(fecha);
  await ensureAgendaPedidosEspejadosEnBloqueosLogistica(fecha);
  const baseCap = await fetchCapacidadMaximaHora().catch(() => 50);
  const [pedidos, bloqueos] = await Promise.all([
    fetchPedidosAgendaOcupanCupoParaDia(fecha),
    fetchBloqueosLogisticaIntervalsForDay(fecha),
  ]);
  const caps = buildCapPerHour(hours, baseCap, bloqueos.intervals);
  const ordenes = mergeOrdersConDedup(pedidos, bloqueos.cascadeOrders);
  const used = accumulateExistingOrders(hours, caps, ordenes);
  return { hours, baseCap, caps, used, bloqueos: bloqueos.intervals };
}
