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
      <div className="max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            Cotización en minutos
          </h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
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

          <p className="mt-8 mb-8 text-sm sm:text-base text-[#cbd5e1] max-w-xl mx-auto leading-relaxed">
            También puedes visitarnos:{" "}
            <span className="text-white font-medium">Concretos Tepexi</span> | Tepeji del Río, Hidalgo.
          </p>

          <button
            type="button"
            onClick={onAgendaVisitaClick}
            className="font-display inline-flex w-full max-w-md mx-auto items-center justify-center gap-2 px-8 py-4 bg-[#141922] hover:bg-[#1c2433] text-white font-semibold rounded-lg border border-[#94a3b8]/25 transition-all uppercase tracking-wide"
          >
            <Calendar size={22} className="shrink-0 text-[#94a3b8]" aria-hidden />
            Agenda una visita
          </button>
        </motion.div>
      </div>
    </section>
  );
}
