"use client";

import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { CONFIG } from "@/config";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer id="ubicacion" className="bg-[#7d7d7d] border-t border-white/25 py-16">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <a href="#inicio" className="inline-flex flex-col items-center md:items-start">
              <div className="flex h-20 w-20 md:h-24 md:w-24 shrink-0 items-center justify-center rounded-full border border-white bg-white p-px shadow-sm">
                <img
                  src="/Logo.jpg"
                  alt="Concretos Tepexi"
                  className="h-full w-full rounded-full object-contain"
                />
              </div>
              <p className="text-[#d6d3d1] mt-4 max-w-xs">
                Concreto premezclado y servicio cercano para constructoras y proyectos en Tepeji del
                Río y alrededores.
              </p>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <h4 className="font-display text-xl font-semibold text-white mb-4 tracking-wide">
              Ubicación y horario
            </h4>
            <a
              href={CONFIG.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-white hover:text-[#fecaca] transition-colors mb-3"
              aria-label="Abrir ubicación en Google Maps"
            >
              <MapPin size={18} className="shrink-0" aria-hidden />
              <span>Haz clic aquí</span>
            </a>
            <div className="flex items-start justify-center gap-2 text-[#d6d3d1] text-sm">
              <Clock size={18} className="shrink-0 mt-0.5" aria-hidden />
              <div className="text-center">
                <p>L-V 8:00 – 17:00 h</p>
                <p>S 8:00 – 13:00 h</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h4 className="font-display text-xl font-semibold text-white mb-4 tracking-wide">
              Redes
            </h4>
            <div className="flex justify-center">
              <a
                href={CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#6b6b6b] flex items-center justify-center text-white hover:bg-[#c62828] hover:text-white transition-all border border-white/25"
                aria-label="Facebook Concretos Tepexi"
              >
                <FacebookIcon className="w-6 h-6" />
              </a>
            </div>
            <p className="mt-4 text-sm font-medium text-[#fafaf9] leading-snug drop-shadow-sm">
              Síguenos para novedades y tips de obra.
            </p>
          </motion.div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-[#e7e5e4] text-sm space-y-2">
          <p>© {new Date().getFullYear()} Concretos Tepexi · Tepeji del Río, Hidalgo.</p>
          <p className="break-words text-xs">
            Powered by{" "}
            <a
              href="https://sigmaaiagency.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:text-[#fecaca] transition-colors"
            >
              Sigma AI Agency
            </a>{" "}
            | Automatización inteligente
          </p>
        </div>
      </div>
    </footer>
  );
}
