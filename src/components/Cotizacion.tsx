"use client";

import { motion } from "framer-motion";
import { Calculator, Calendar } from "lucide-react";

interface CotizacionProps {
  onCotizadorClick: () => void;
  onAgendaVisitaClick: () => void;
}

const cardClass =
  "group flex h-full w-full flex-col rounded-2xl border-2 border-slate-200 bg-white p-6 text-left shadow-lg transition-[border-color,box-shadow,ring,transform] duration-300 hover:border-tepexi-accent/45 hover:shadow-md hover:ring-2 hover:ring-tepexi-accent/15 sm:p-7 md:p-8";

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
            Cotización guiada en línea
          </h2>
          <p className="mx-auto mb-10 max-w-2xl leading-relaxed text-[var(--tepexi-text-muted)]">
            Cuéntanos volumen aproximado, resistencia y ubicación de obra; el cotizador estima tu pedido y ya puedes
            canalizar tu compra con datos claros.
          </p>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <button type="button" onClick={onCotizadorClick} className={cardClass}>
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-tepexi-accent/25 bg-tepexi-accent-soft text-tepexi-accent shadow-sm transition group-hover:border-tepexi-accent/40">
                <Calculator size={24} className="shrink-0" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-2xl">
                Cotizador Narváez
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--tepexi-text-body)] sm:text-base">
                Introduce tipo de vaciado, distancia estimada y resistencia deseada; recibes una propuesta orientativa y
                opciones para cerrar pedido con un asesor.
              </p>
              <span className="font-display mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tepexi-accent px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md transition group-hover:bg-tepexi-accent-hover sm:text-base">
                <Calculator size={20} className="shrink-0 opacity-95" aria-hidden />
                Abrir cotizador
              </span>
            </button>

            <button type="button" onClick={onAgendaVisitaClick} className={cardClass}>
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-[var(--tepexi-section-gray)] text-tepexi-accent shadow-sm transition group-hover:border-tepexi-accent/35 group-hover:bg-tepexi-accent-soft">
                <Calendar size={24} className="shrink-0" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-2xl">
                Visita nuestra planta o vamos a tú obra
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--tepexi-text-body)] sm:text-base">
                Agenda una cita para conocer instalaciones en{" "}
                <span className="font-semibold text-[var(--tepexi-logo-navy)]">Jilotepec</span> u organizar revisión en tu
                frente de trabajo.
              </p>
              <span className="font-display mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--tepexi-logo-navy)] bg-white px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[var(--tepexi-logo-navy)] shadow-sm transition group-hover:border-tepexi-accent group-hover:bg-tepexi-accent-soft group-hover:text-tepexi-accent sm:text-base">
                <Calendar size={20} className="shrink-0" aria-hidden />
                Agendar visita
              </span>
            </button>
          </div>

          <p className="mx-auto mt-10 max-w-xl text-sm text-[var(--tepexi-text-muted)] sm:text-base">
            ¿Necesitas otra modalidad de compra? Escríbenos por WhatsApp o marca por teléfono:
            con gusto te ayudamos en tu proyecto.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
