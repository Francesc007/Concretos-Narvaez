"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import { heroVideoSrc } from "@/config";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useLayoutEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.setAttribute("fetchpriority", "high");
    el.play().catch(() => {});
  }, []);

  return (
    <section
      id="inicio"
      className="relative flex min-h-screen min-h-[100dvh] w-full max-w-full items-center justify-center overflow-x-hidden bg-black"
    >
      <video
        ref={videoRef}
        className="tepexi-hero-video pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
        src={heroVideoSrc()}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        width={1920}
        height={1080}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#132f4c]/55 via-[#132f4c]/32 to-black/45" />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl px-3 pt-28 pb-16 text-center sm:px-4 sm:pt-32">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display mb-4 inline-block max-w-full rounded-md border-2 border-[#e53935] bg-gradient-to-r from-[#c62828] to-[#b71c1c] px-2 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_4px_24px_rgba(183,28,28,0.5)] [text-wrap:balance] ring-1 ring-inset ring-white/25 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:px-3 sm:py-1.5 sm:text-base"
        >
          Concreto premezclado · Tepeji del Río, Hgo.
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display mb-6 text-4xl font-extrabold leading-tight text-white [text-wrap:balance] drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Solidez certificada · Confianza para cada metro de tu obra
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mb-12 max-w-2xl text-pretty text-lg text-white/95 sm:text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
        >
          {'\u201c'}
          Más de 20 años de experiencia suministrando concreto de alta resistencia a proyectos
          industriales, comerciales y residenciales. Calidad NMX con entrega puntual garantizada.
          {'\u201d'}
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
