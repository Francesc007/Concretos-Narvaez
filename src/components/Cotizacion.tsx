"use client";

import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { CONFIG } from "@/config";

interface CotizacionProps {
  onOpenModal: () => void;
}

export function Cotizacion({ onOpenModal }: CotizacionProps) {
  const waHref = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodeURIComponent(CONFIG.whatsappDefaultMessage)}`;

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
          <p className="text-[#94a3b8] max-w-2xl mx-auto mb-10">
            Indícanos volumen aproximado, tipo de obra y fecha deseada. Te respondemos por WhatsApp
            con una propuesta clara y seguimiento cercano.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <button
              type="button"
              onClick={onOpenModal}
              className="font-display inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c62828] hover:bg-[#e53935] text-white font-semibold rounded-lg transition-all hover:scale-[1.02] shadow-xl uppercase tracking-wide"
            >
              <MessageCircle size={22} />
              Armar mensaje de cotización
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#141922] hover:bg-[#1c2433] text-white font-semibold rounded-lg border border-[#94a3b8]/25 transition-all uppercase tracking-wide"
            >
              <Phone size={20} />
              WhatsApp directo
            </a>
          </div>
          <p className="mt-8 text-sm text-[#64748b]">
            También puedes visitarnos:{" "}
            <span className="text-[#cbd5e1]">Concreto Premezclado Tepeji</span> — Tepeji del Río,
            Hidalgo.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
