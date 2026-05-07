"use client";

import { motion } from "framer-motion";
import { Calculator, Calendar } from "lucide-react";

interface CotizacionProps {
  onCotizadorClick: () => void;
  onAgendaVisitaClick: () => void;
}

const cardClass =
  "group flex h-full w-full flex-col rounded-2xl border-2 border-slate-200 bg-white p-6 text-left shadow-lg transition-[border-color,box-shadow,ring,transform] duration-300 hover:border-[#c62828]/45 hover:shadow-md hover:ring-2 hover:ring-[#c62828]/15 sm:p-7 md:p-8";

export function Cotizacion({ onCotizadorClick, onAgendaVisitaClick }: CotizacionProps) {
  return (
    <section
      id="cotizacion"
      className="border-y border-[var(--tepexi-border-light)] bg-[var(--tepexi-section-bluewash)] py-20 md:py-28"
    >
      <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display mb-4 text-4xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] md:text-5xl">
            Cotización en minutos
          </h2>
          <p className="mx-auto mb-10 max-w-2xl leading-relaxed text-[var(--tepexi-text-muted)]">
            Compártenos algunos datos para tu proyecto en nuestro Cotizador Automático, te encantará la
            experiencia.
          </p>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <button type="button" onClick={onCotizadorClick} className={cardClass}>
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#c62828]/25 bg-[#fef2f2] text-[#c62828] shadow-sm transition group-hover:border-[#c62828]/40">
                <Calculator size={24} className="shrink-0" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-2xl">
                Cotizador automático
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--tepexi-text-body)] sm:text-base">
                Volumen, resistencia y entrega: obtén una estimación al instante y reserva tu pedido.
              </p>
              <span className="font-display mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c62828] px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md transition group-hover:bg-[#e53935] sm:text-base">
                <Calculator size={20} className="shrink-0 opacity-95" aria-hidden />
                Abrir cotizador
              </span>
            </button>

            <button type="button" onClick={onAgendaVisitaClick} className={cardClass}>
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-[var(--tepexi-section-gray)] text-[#c62828] shadow-sm transition group-hover:border-[#c62828]/35 group-hover:bg-[#fef2f2]">
                <Calendar size={24} className="shrink-0" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-2xl">
                Agenda una visita
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--tepexi-text-body)] sm:text-base">
                Coordina fecha y horario para conocernos en planta o en obra. Te atendemos en{" "}
                <span className="font-semibold text-[var(--tepexi-logo-navy)]">Tepeji del Río</span>, Hidalgo.
              </p>
              <span className="font-display mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--tepexi-logo-navy)] bg-white px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[var(--tepexi-logo-navy)] shadow-sm transition group-hover:border-[#c62828] group-hover:bg-[#fef2f2] group-hover:text-[#c62828] sm:text-base">
                <Calendar size={20} className="shrink-0" aria-hidden />
                Agendar visita
              </span>
            </button>
          </div>

          <p className="mx-auto mt-10 max-w-xl text-sm text-[var(--tepexi-text-muted)] sm:text-base">
            ¿Dudas? Escríbenos por WhatsApp o llámanos; con gusto te orientamos.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
