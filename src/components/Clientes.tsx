"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

function fileNameToAlt(file: string): string {
  const base = file.replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || file;
}

type ClientesProps = { imageFiles: string[] };

/** Ranuras de ancho fijo + duplicado en carril; -50% del ancho total = un ciclo exacto. */
const slideClassName =
  "flex min-w-0 shrink-0 grow-0 basis-[8.5rem] items-stretch justify-center px-5.5 sm:basis-46 md:basis-55";

export function Clientes({ imageFiles }: ClientesProps) {
  const logos = useMemo(
    () =>
      imageFiles.map((file) => ({
        src: `/Clientes/${encodeURIComponent(file)}`,
        alt: fileNameToAlt(file),
      })),
    [imageFiles],
  );

  const trackLogos = useMemo(() => [...logos, ...logos], [logos]);

  if (logos.length === 0) return null;

  return (
    <section
      id="clientes"
      className="relative overflow-hidden border-t border-[var(--tepexi-logo-navy)]/20 bg-[var(--tepexi-logo-navy)] py-10 md:py-14"
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
            Calidad presente en obras de marcas líderes
          </h2>
          <p className="max-w-3xl mx-auto text-pretty text-sm text-white/90 sm:text-base leading-relaxed">
            Desde suministro para infraestructura nacional como CFE y Pemex, hasta proyectos industriales
            y comerciales para Costco, P&amp;G, Truper y AutoZone.
          </p>
        </motion.div>
      </div>

      {/* Carril continuo (marquee CSS); sin snaps ni arrastre tipo carrusel */}
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
            <div className="overflow-hidden">
              <div className="tepexi-clientes-marquee-continuous">
                {trackLogos.map((logo, i) => (
                  <div key={`${logo.src}-${i}`} className={slideClassName}>
                    <LogoSlide logo={logo} duplicate={i >= logos.length} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="relative mx-auto mt-5 max-w-4xl px-3 text-center text-[10px] leading-snug text-white/65 sm:text-xs sm:leading-relaxed">
        Los logotipos son propiedad de sus respectivos titulares y se exhiben con fines informativos
        sobre proyectos suministrados.
      </p>
    </section>
  );
}

function LogoSlide({ logo, duplicate }: { logo: { src: string; alt: string }; duplicate: boolean }) {
  return (
    <div className="flex h-14 w-full items-center justify-center md:h-16">
      <img
        src={logo.src}
        alt={duplicate ? "" : logo.alt}
        {...(duplicate ? { "aria-hidden": true as const } : {})}
        className="max-h-full w-full max-w-full object-contain object-center select-none opacity-[0.85] transition-opacity duration-300 ease-out hover:opacity-100 active:opacity-100"
        loading={duplicate ? "lazy" : "eager"}
        decoding="async"
        draggable={false}
        {...(!duplicate ? { fetchPriority: "high" as const } : {})}
      />
    </div>
  );
}
