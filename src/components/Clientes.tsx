"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef } from "react";

function fileNameToAlt(file: string): string {
  const base = file.replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || file;
}

type ClientesProps = { imageFiles: string[] };

export function Clientes({ imageFiles }: ClientesProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const logos = useMemo(
    () =>
      imageFiles.map((file) => ({
        src: `/Clientes/${encodeURIComponent(file)}`,
        alt: fileNameToAlt(file),
      })),
    [imageFiles],
  );

  const trackLogos = useMemo(() => [...logos, ...logos], [logos]);

  useLayoutEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const syncMarqueeDistance = () => {
      const w = node.scrollWidth;
      if (w <= 0) return;
      const half = w / 2;
      node.style.setProperty("--tepexi-clientes-marquee-x", `-${half}px`);
    };

    syncMarqueeDistance();

    const ro = new ResizeObserver(() => syncMarqueeDistance());
    ro.observe(node);

    const imgs = node.querySelectorAll("img");
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", syncMarqueeDistance, { once: true });
    });

    return () => ro.disconnect();
  }, [logos]);

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
            Clientes
          </h2>
          <p className="max-w-2xl mx-auto text-pretty text-sm text-white/90 sm:text-base leading-relaxed">
            Empresas y marcas nacionales e internacionales que confían en nosotros: Concretos Tepexi.
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
            <div ref={trackRef} className="tepexi-clientes-marquee gap-10 sm:gap-10 md:gap-20">
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

function LogoSlide({ logo, duplicate }: { logo: { src: string; alt: string }; duplicate: boolean }) {
  return (
    <div className="flex h-14 w-[8.5rem] shrink-0 items-center justify-center sm:h-[3.5rem] sm:w-36 md:h-16 md:w-40">
      <img
        src={logo.src}
        alt={duplicate ? "" : logo.alt}
        {...(duplicate ? { "aria-hidden": true as const } : {})}
        className={`max-h-full w-auto max-w-full object-contain object-center transition-opacity duration-300 select-none ${
          duplicate ? "opacity-90" : "opacity-95 hover:opacity-100"
        }`}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
