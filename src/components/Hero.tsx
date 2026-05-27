"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CONFIG, heroVideoSrc } from "@/config";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPlayback = () => {
      if (motionQuery.matches) {
        video.pause();
        return;
      }
      void video.play().catch(() => {});
    };

    syncPlayback();
    video.addEventListener("loadeddata", syncPlayback);
    motionQuery.addEventListener("change", syncPlayback);
    return () => {
      video.removeEventListener("loadeddata", syncPlayback);
      motionQuery.removeEventListener("change", syncPlayback);
    };
  }, []);

  return (
    <section
      id="inicio"
      className="relative flex min-h-screen min-h-[100dvh] w-full max-w-full items-center justify-center overflow-x-hidden bg-black"
      aria-label={`${CONFIG.companyDisplayName} — inicio`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <video
          ref={videoRef}
          className="tepexi-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
        >
          <source src={heroVideoSrc()} type="video/mp4" />
        </video>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#3d3d3d]/58 via-[#3d3d3d]/34 to-black/45" />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl px-3 pt-28 pb-16 text-center sm:px-4 sm:pt-32">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display mb-4 inline-block max-w-full rounded-md border-2 border-tepexi-accent-hover bg-gradient-to-r from-tepexi-accent to-tepexi-accent-hover px-2 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_4px_24px_rgba(246,51,6,0.45)] [text-wrap:balance] ring-1 ring-inset ring-white/25 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:px-3 sm:py-1.5 sm:text-base"
        >
          Premezclado en Jilotepec y zona norte del Edo. Méx.
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display mb-6 text-4xl font-extrabold leading-tight text-white [text-wrap:balance] drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Concreto Certificado para la Construcción | Soluciones para tu Proyecto
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mb-12 max-w-2xl text-pretty text-lg text-white/95 sm:text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
        >
          {'\u201c'}
          Suministramos concreto premezclado bajo normas estrictas de calidad para obra civil e industrial. Contamos con pruebas de laboratorio. Coordinamos la logística de entrega para que el colado avance al ritmo planeado, protegiendo tu presupuesto y tu cronograma.
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
            Ver líneas de servicio
          </a>
        </motion.div>
      </div>
    </section>
  );
}
