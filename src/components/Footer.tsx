"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
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
    <footer id="ubicacion" className="bg-[#7d7d7d] border-t border-white/25 py-12 md:py-14">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 mb-8 md:mb-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <div className="inline-flex flex-col items-center md:items-start">
              <a href="#inicio" className="inline-flex flex-col items-center md:items-start">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-[4.25rem] md:w-[4.25rem] shrink-0 items-center justify-center rounded-full border border-white bg-white p-px shadow-sm">
                  <img
                    src="/Logo%20tepexi.png"
                    alt="Concretos Tepexi"
                    className="h-full w-full rounded-full object-contain"
                  />
                </div>
                <p className="text-[#d6d3d1] mt-3 max-w-xs text-sm leading-snug">
                  Concreto premezclado y servicio cercano para constructoras y proyectos en Tepeji del
                  Río y alrededores.
                </p>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <h4 className="font-display text-lg md:text-xl font-semibold text-white mb-3 tracking-wide">
              Ubicación y Horario
            </h4>
            <a
              href={CONFIG.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-center gap-2 text-white hover:text-[#fecaca] transition-colors mb-2"
              aria-label="Abrir ubicación en Google Maps"
            >
              <MapPin size={18} className="shrink-0 mt-0.5" aria-hidden />
              <span className="max-w-md text-center text-sm sm:text-base leading-snug [word-break:normal]">
                <span className="block">Carretera Tepeji-San Ignacio Nopala,</span>
                <span className="block">Km 6, San Ignacio Nopala, 42890, Hgo.</span>
              </span>
            </a>
            <div className="flex items-start justify-center gap-2 text-[#d6d3d1] text-sm mt-5">
              <Clock size={18} className="shrink-0 mt-0.5" aria-hidden />
              <div className="text-center">
                <p>Lun - Vie 8:00 – 17:00 h</p>
                <p>Sab 8:00 – 13:00 h</p>
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
            <h4 className="font-display text-lg md:text-xl font-semibold text-white mb-3 tracking-wide">
              Contacto y redes
            </h4>
            <address className="not-italic mx-auto mb-6 flex w-full max-w-md flex-col items-center space-y-5">
              <a
                href={`mailto:${CONFIG.contactEmail}`}
                className="flex max-w-full items-center justify-center gap-2 text-sm text-white hover:text-[#fecaca] transition-colors break-words text-center"
              >
                <Mail size={15} className="shrink-0 opacity-90" aria-hidden />
                <span>{CONFIG.contactEmail}</span>
              </a>
              <div className="flex items-start justify-center gap-2 text-sm text-[#eae9e8]">
                <Phone size={15} className="shrink-0 opacity-90 mt-0.5" aria-hidden />
                <ul className="space-y-1 list-none text-center">
                  <li>55 4260 0590</li>
                  <li>773 158 5835</li>
                  <li> Fijo: 55 1555 2097</li>
                </ul>
              </div>
            </address>
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
          </motion.div>
        </div>

        <div className="border-t border-white/20 pt-6 text-center text-[#e7e5e4] text-sm space-y-1.5">
          <p className="break-words text-xs md:text-[13px]">
            <Link
              href="/aviso-privacidad"
              className="text-[#fafaf9] hover:text-[#fecaca] underline-offset-4 hover:underline transition-colors"
            >
              Aviso de privacidad
            </Link>
          </p>
          <p>© {new Date().getFullYear()} CONCRETOS TEPEXI · TODOS LOS DERECHOS RESERVADOS.</p>
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
