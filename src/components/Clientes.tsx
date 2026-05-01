"use client";

import { motion } from "framer-motion";

/** Imágenes de `public/Clientes` en el carrusel. */
const clientAssetFiles = [
  { file: "Arlus.png", alt: "Arlus" },
  { file: "Marvic.png", alt: "Marvic" },
  { file: "Peri.png", alt: "Peri" },
  { file: "Tubos y Barras.png", alt: "Tubos y Barras" },
  { file: "under terra.gif", alt: "Under Terra" },
] as const;

const logos = clientAssetFiles.map(({ file, alt }) => ({
  src: `/Clientes/${encodeURIComponent(file)}`,
  alt,
}));

const trackLogos = [...logos, ...logos];

function LogoSlide({ logo, duplicate }: { logo: (typeof logos)[number]; duplicate: boolean }) {
  return (
    <div className="flex shrink-0 items-center justify-center">
      <img
        src={logo.src}
        alt={duplicate ? "" : logo.alt}
        {...(duplicate ? { "aria-hidden": true as const } : {})}
        className={`max-h-[3rem] sm:max-h-[3.5rem] md:max-h-16 w-auto max-w-[8.5rem] object-contain object-center transition-opacity duration-300 select-none ${
          duplicate ? "opacity-90" : "opacity-95 hover:opacity-100"
        }`}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

export function Clientes() {
  return (
    <section
      id="clientes"
      className="py-10 md:py-14 bg-[#141922] border-t border-[#78716c]/25 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0v64M0 32h64' stroke='%23c62828' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 mb-6 md:mb-7">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 tracking-wide">
            Clientes
          </h2>
          <p className="text-[#d8e3ee] max-w-2xl mx-auto text-pretty text-sm sm:text-base">
            Empresas y marcas que confían en nosotros: Concretos Tepexi.
          </p>
        </motion.div>
      </div>

      {/* Solo la franja del carrusel en blanco */}
      <div className="relative w-full bg-white border-y border-black/[0.07] shadow-[0_12px_40px_-20px_rgba(0,0,0,0.45)]">
        <div className="relative w-full min-w-0 overflow-x-hidden px-4 sm:px-8 md:px-12">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white via-white/95 to-transparent sm:w-12 md:w-46"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white via-white/95 to-transparent sm:w-12 md:w-46"
            aria-hidden
          />

          <div className="py-2.5 md:py-7">
            {/* Sin padding en el elemento animado: -50 % = una repetición exacta */}
            <div className="tepexi-clientes-marquee gap-10 sm:gap-10 md:gap-20">
              {trackLogos.map((logo, i) => (
                <LogoSlide
                  key={`${logo.src}-${i}`}
                  logo={logo}
                  duplicate={i >= logos.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
