"use client";

import { motion } from "framer-motion";
import { Calculator, Calendar } from "lucide-react";

interface CotizacionProps {
  onCotizadorClick: () => void;
  onAgendaVisitaClick: () => void;
}

export function Cotizacion({ onCotizadorClick, onAgendaVisitaClick }: CotizacionProps) {
  return (
    <section id="cotizacion" className="py-20 md:py-28 bg-[#0c0f14] border-y border-[#78716c]/25">
      <div className="mx-auto w-full min-w-0 max-w-5xl px-3 text-center sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            Cotización en minutos
          </h2>
          <p className="text-[#d8e3ee] max-w-2xl mx-auto mb-10 leading-relaxed">
            Compártenos algunos datos para tu proyecto en nuestro Cotizador Automático, te encantará la
            experiencia.
          </p>

          <button
            type="button"
            onClick={onCotizadorClick}
            className="font-display inline-flex w-full max-w-md mx-auto items-center justify-center gap-2 px-8 py-4 bg-[#c62828] hover:bg-[#e53935] text-white font-semibold rounded-lg transition-all hover:scale-[1.02] shadow-xl uppercase tracking-wide"
          >
            <Calculator size={22} className="shrink-0" aria-hidden />
            Cotizador Automático
          </button>

          <p className="mt-8 mb-8 text-sm sm:text-base text-[#ecf0f6] max-w-xl mx-auto leading-relaxed">
            También puedes visitarnos:{" "}
            <span className="text-white font-medium">Concretos Tepexi</span> | Tepeji del Río, Hidalgo.
          </p>

          <button
            type="button"
            onClick={onAgendaVisitaClick}
            className="font-display inline-flex w-full max-w-md mx-auto items-center justify-center gap-2 px-8 py-4 bg-[#141922] hover:bg-[#1c2433] text-white font-semibold rounded-lg border border-[#cfd8e2]/35 transition-all uppercase tracking-wide"
          >
            <Calendar size={22} className="shrink-0 text-[#d8e3ee]" aria-hidden />
            Agenda una visita
          </button>
        </motion.div>
      </div>
    </section>
  );
}
