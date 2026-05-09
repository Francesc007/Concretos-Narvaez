/**
 * Capacidad lineal por hora (efecto cascada) para agenda logística.
 * Sin dependencias de Google Sheets — solo números y HH:mm normalizado.
 */

export interface IntervalMinutes {
  start: number;
  end: number;
}

/** hh:mm → minutos desde medianoche */
export function hmToMinutes(hm: string): number {
  const p = hm.trim().split(":");
  const h = parseInt(p[0] ?? "0", 10);
  const m = parseInt(p[1] ?? "0", 10);
  const hh = Number.isFinite(h) ? h : 0;
  const mm = Number.isFinite(m) ? m : 0;
  return hh * 60 + mm;
}

export function normalizeHoraSlot(hora: string): string {
  const p = hora.trim().split(":");
  const h = parseInt(p[0] ?? "0", 10);
  const m = parseInt(p[1] ?? "0", 10);
  return `${String(Number.isFinite(h) ? h : 0).padStart(2, "0")}:${String(Number.isFinite(m) ? m : 0).padStart(2, "0")}`;
}

/** Intervalos semiabiertos: slot [a,b) vs bloqueo [start,end) */
export function intervalsOverlap(slotStart: number, slotEnd: number, block: IntervalMinutes): boolean {
  return !(block.end <= slotStart || block.start >= slotEnd);
}

/** Franja horaria de agenda por índice: HH:00 con duración 60 min. */
export function hourSlotTouchesBlock(hourHm: string, blocks: readonly IntervalMinutes[]): boolean {
  const slotStart = hmToMinutes(hourHm);
  const slotEnd = slotStart + 60;
  return blocks.some((b) => intervalsOverlap(slotStart, slotEnd, b));
}

export function buildCapPerHour(
  hours: readonly string[],
  baseCap: number,
  logisticBlocks: readonly IntervalMinutes[],
): Record<string, number> {
  const caps: Record<string, number> = {};
  for (const h of hours) {
    caps[h] = hourSlotTouchesBlock(h, logisticBlocks) ? 0 : baseCap;
  }
  return caps;
}

function emptyUsed(hours: readonly string[]): Record<string, number> {
  return Object.fromEntries(hours.map((h) => [h, 0]));
}

/**
 * Simula colocar volumen desde startHour: consume capacidad en cascada H, H+1…
 * Si la hora de inicio no tiene capacidad, falla (no “salta” el inicio).
 */
export function simulateAddVolumeToUsed(
  used: Record<string, number>,
  caps: Record<string, number>,
  hours: readonly string[],
  startHourRaw: string,
  volume: number,
): { ok: boolean; usedAfter: Record<string, number> } {
  const startHour = normalizeHoraSlot(startHourRaw);
  const startIdx = hours.indexOf(startHour);
  const usedAfter = { ...used };

  if (startIdx < 0 || volume <= 0) {
    return { ok: false, usedAfter };
  }

  let rem = volume;
  let idx = startIdx;

  while (rem > 0 && idx < hours.length) {
    const h = hours[idx]!;
    const avail = (caps[h] ?? 0) - usedAfter[h]!;
    if (avail <= 0) {
      if (idx === startIdx) {
        return { ok: false, usedAfter };
      }
      idx++;
      continue;
    }
    const take = Math.min(rem, avail);
    usedAfter[h] = (usedAfter[h] ?? 0) + take;
    rem -= take;
    if (rem > 0) idx++;
  }

  return { ok: rem <= 0.000_001, usedAfter };
}

/** Volúmenes ya comprometidos por pedidos del día (orden cronológico por hora de inicio). */
export function accumulateExistingOrders(
  hours: readonly string[],
  caps: Record<string, number>,
  orders: readonly { hora: string; volumen: number }[],
): Record<string, number> {
  const sorted = [...orders].sort((a, b) => normalizeHoraSlot(a.hora).localeCompare(normalizeHoraSlot(b.hora)));
  let used = emptyUsed(hours);
  for (const o of sorted) {
    const { usedAfter } = simulateAddVolumeToUsed(used, caps, hours, o.hora, o.volumen);
    used = usedAfter;
  }
  return used;
}

export function canScheduleVolume(
  used: Record<string, number>,
  caps: Record<string, number>,
  hours: readonly string[],
  startHour: string,
  volume: number,
): boolean {
  return simulateAddVolumeToUsed(used, caps, hours, startHour, volume).ok;
}

/** Primera hora operativa donde cabe el volumen completo respecto al uso ya calculado. */
export function findNextSuggestedHour(
  used: Record<string, number>,
  caps: Record<string, number>,
  hours: readonly string[],
  volume: number,
): string | null {
  for (const h of hours) {
    if ((caps[h] ?? 0) <= 0) continue;
    if (canScheduleVolume(used, caps, hours, h, volume)) return h;
  }
  return null;
}
