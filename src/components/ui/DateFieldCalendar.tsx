"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { es as rdpEs } from "react-day-picker/locale";

import "react-day-picker/style.css";

function parseYmdLocal(s: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return undefined;
  return dt;
}

function todayYmdLocal(): string {
  const d = new Date();
  return format(d, "yyyy-MM-dd");
}

export interface DateFieldCalendarProps {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  /** yyyy-MM-dd: no permitir fechas anteriores (p. ej. hoy). Si se omite, solo se usa en modo “desde hoy” con `disablePast`. */
  minDate?: string;
  /** Si es true y no hay minDate, se usa hoy como mínimo */
  disablePast?: boolean;
  placeholder?: string;
  className?: string;
}

export function DateFieldCalendar({
  id,
  value,
  onChange,
  minDate,
  disablePast = true,
  placeholder = "Elegir fecha",
  className = "",
}: DateFieldCalendarProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });

  const selected = value ? parseYmdLocal(value) : undefined;
  const minD = minDate
    ? parseYmdLocal(minDate)
    : disablePast
      ? startOfDay(new Date())
      : undefined;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const panelW = 320;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - panelW - 8));
      setPanelPos({ top: r.bottom + 8, left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const label =
    selected && !Number.isNaN(selected.getTime())
      ? format(selected, "EEEE d 'de' MMMM yyyy", { locale: es })
      : placeholder;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full py-3 px-4 bg-[#0c0f14] border border-[#94a3b8]/25 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#c62828]/60 flex items-center justify-between gap-2 min-h-[48px]"
      >
        <span className={selected ? "text-white text-sm sm:text-base" : "text-[#64748b]"}>{label}</span>
        <Calendar className="h-5 w-5 shrink-0 text-[#94a3b8]" aria-hidden />
      </button>
      {mounted &&
        open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className="tepexi-rdp fixed z-[10000] w-[min(100vw-1rem,20rem)] rounded-xl border border-[#94a3b8]/25 bg-[#141922] p-3 shadow-2xl"
            style={{ top: panelPos.top, left: panelPos.left }}
            role="dialog"
            aria-label="Calendario"
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (d) {
                  onChange(format(d, "yyyy-MM-dd"));
                  setOpen(false);
                }
              }}
              locale={rdpEs}
              disabled={minD ? { before: minD } : undefined}
              defaultMonth={selected ?? minD ?? new Date()}
              weekStartsOn={1}
              className="tepexi-rdp-inner"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

export { todayYmdLocal };
