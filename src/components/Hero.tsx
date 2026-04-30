"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen min-h-[100dvh] w-full max-w-full items-center justify-center overflow-x-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${encodeURI("/Hero 3.jpg")})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0f14]/45 via-[#0c0f14]/28 to-[#0c0f14]/60" />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 text-center pt-28 pb-16 sm:pt-32">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display mb-4 inline-block max-w-full rounded-md border-2 border-[#c62828]/90 bg-[#0c0f14]/40 px-2 py-1.5 text-sm uppercase tracking-[0.2em] text-[#ffe8eb] [text-wrap:balance] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:px-3 sm:py-1.5 sm:text-base"
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
          className="mx-auto mb-12 max-w-2xl text-pretty text-lg text-[#ecf0f6] sm:text-xl"
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
            className="font-display w-full rounded-lg border border-white/20 bg-white/10 px-6 py-3.5 text-center text-white font-semibold uppercase tracking-wide shadow-xl transition-all hover:scale-[1.02] hover:bg-white/15 sm:w-auto sm:px-8 sm:py-4"
          >
            Ver servicios
          </a>
        </motion.div>
      </div>
    </section>
  );
}
