"use client";

import { motion } from "framer-motion";

/** Misma ruta: `public/Hero.mp4`. Sube el número si cambias el archivo y ves el video antiguo por caché. */
const HERO_VIDEO_VERSION = 2;

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen min-h-[100dvh] w-full max-w-full items-center justify-center overflow-x-hidden"
    >
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src={`/Hero.mp4?v=${HERO_VIDEO_VERSION}`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#132f4c]/55 via-[#132f4c]/32 to-black/45" />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 text-center pt-28 pb-16 sm:pt-32">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display mb-4 inline-block max-w-full rounded-md border-2 border-white/90 bg-white/15 px-2 py-1.5 text-sm uppercase tracking-[0.2em] text-white [text-wrap:balance] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:px-3 sm:py-1.5 sm:text-base"
        >
          Concreto premezclado · Tepeji del Río, Hgo.
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display text-4xl [text-wrap:balance] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
        >
          Solidez y confianza para cada metro de tu obra
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mb-12 max-w-2xl text-pretty text-lg text-white/95 sm:text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
        >
          En Concretos Tepexi entregamos mezclas certificadas, asesoría técnica y puntualidad en
          planta y obra. Utiliza nuestra herramienta para cotizar y recibe acompañamiento de principio a fin.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mx-auto flex w-full max-w-sm flex-col justify-center gap-4 sm:max-w-none sm:flex-row"
        >
          <a
            href="#servicios"
            className="font-display w-full rounded-lg border-2 border-white/80 bg-white/95 px-6 py-3.5 text-center font-semibold uppercase tracking-wide text-[var(--tepexi-logo-navy)] shadow-xl transition-all hover:scale-[1.02] hover:border-[var(--tepexi-logo-navy)] hover:bg-[var(--tepexi-logo-navy)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:border-[var(--tepexi-logo-navy)] active:bg-[var(--tepexi-logo-navy)] active:text-white sm:w-auto sm:px-8 sm:py-4"
          >
            Ver servicios
          </a>
        </motion.div>
      </div>
    </section>
  );
}
