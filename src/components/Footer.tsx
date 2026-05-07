"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { CONFIG } from "@/config";

function WhatsAppIconSmall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function whatsappHref(phoneDigits: string) {
  const text = encodeURIComponent(CONFIG.whatsappDefaultMessage);
  return `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${text}`;
}

export function Footer() {
  return (
    <footer id="ubicacion" className="border-t border-slate-500/30 bg-[#5c6777] py-12 md:py-14 text-white">
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
                <div className="flex h-[4rem] w-[4rem] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--tepexi-logo-navy)] bg-white p-2 shadow-sm md:h-[4.7rem] md:w-[4.7rem] md:p-1.5">
                  <img
                    src="/Tepexi%20A-R.jpeg"
                    alt="Concretos Tepexi"
                    className="max-h-full max-w-full object-contain object-center"
                  />
                </div>
                <p className="mt-3 max-w-xs text-sm leading-snug text-slate-100">
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
              className="flex items-start justify-center gap-2 text-white transition-colors hover:text-[#a5d8ff] mb-2"
              aria-label="Abrir ubicación en Google Maps"
            >
              <MapPin size={18} className="shrink-0 mt-0.5" aria-hidden />
              <span className="max-w-md text-center text-sm sm:text-base leading-snug [word-break:normal]">
                <span className="block">Carretera Tepeji-San Ignacio Nopala,</span>
                <span className="block">Km 6, San Ignacio Nopala, 42890, Hgo.</span>
              </span>
            </a>
            <div className="flex items-start justify-center gap-2 text-slate-200 text-sm mt-5">
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
                className="flex max-w-full items-center justify-center gap-2 text-sm text-white transition-colors hover:text-[#a5d8ff] break-words text-center"
              >
                <Mail size={15} className="shrink-0 opacity-90" aria-hidden />
                <span>{CONFIG.contactEmail}</span>
              </a>
              <ul className="list-none space-y-2.5 text-center text-sm text-slate-100">
                <li>
                  <a
                    href={whatsappHref(CONFIG.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-white transition-colors hover:text-[#a5d8ff]"
                  >
                    <WhatsAppIconSmall className="h-4 w-4 shrink-0 text-[#25D366]" />
                    <span>55 4260 0590</span>
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappHref(CONFIG.whatsappSecondaryNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-white transition-colors hover:text-[#a5d8ff]"
                  >
                    <WhatsAppIconSmall className="h-4 w-4 shrink-0 text-[#25D366]" />
                    <span>773 158 5835</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${CONFIG.landlinePhoneE164}`}
                    className="inline-flex items-center justify-center gap-2 text-white transition-colors hover:text-[#a5d8ff]"
                  >
                    <Phone size={15} className="shrink-0 opacity-90" aria-hidden />
                    <span>55 1555 2097</span>
                  </a>
                </li>
              </ul>
            </address>
            <div className="flex justify-center">
              <a
                href={CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-[#c62828] transition-all border border-white/30"
                aria-label="Facebook Concretos Tepexi"
              >
                <FacebookIcon className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-white/15 pt-6 text-center text-slate-200/95 text-sm space-y-1.5">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 break-words text-xs md:text-[13px]">
            <Link
              href="/aviso-privacidad"
              className="text-[#fafaf9] transition-colors underline-offset-4 hover:text-[#a5d8ff] hover:underline"
            >
              Aviso de privacidad
            </Link>
            <span className="text-slate-400/90 select-none" aria-hidden>
              ·
            </span>
            <Link
              href="/politica-calidad"
              className="text-[#fafaf9] transition-colors underline-offset-4 hover:text-[#a5d8ff] hover:underline"
            >
              Política de calidad
            </Link>
          </p>
          <p>© {new Date().getFullYear()} CONCRETOS TEPEXI · TODOS LOS DERECHOS RESERVADOS.</p>
          <p className="break-words text-xs">
            Powered by{" "}
            <a
              href="https://sigmaaiagency.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white transition-colors hover:text-[#a5d8ff]"
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
