"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${encodeURI("/Hero 3.jpg")})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0f14]/45 via-[#0c0f14]/28 to-[#0c0f14]/60" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-28 pb-16">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-[#ffcdd2] tracking-[0.2em] text-sm sm:text-base uppercase mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] border-2 border-[#c62828]/90 rounded-md px-3 py-1.5 inline-block bg-[#0c0f14]/40"
        >
          Concreto premezclado · Tepeji del Río, Hgo.
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Solidez y confianza para cada metro de tu obra
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg sm:text-xl text-[#cbd5e1] mb-12 max-w-2xl mx-auto"
        >
          En Concretos Tepexi entregamos mezclas certificadas, asesoría técnica y puntualidad en
          planta y obra. Cotiza por WhatsApp y recibe acompañamiento de principio a fin.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="#servicios"
            className="font-display px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-all hover:scale-[1.02] shadow-xl uppercase tracking-wide border border-white/20"
          >
            Ver servicios
          </a>
        </motion.div>
      </div>
    </section>
  );
}
// La imagen en el Hero está en la línea:
// className="absolute inset-0 bg-cover bg-center bg-no-repeat"
// style={{
//   backgroundImage: `url(${encodeURI("/Hero 3.jpg")})`,
// }}
// Es decir, la imagen está configurada como fondo en el div principal del Hero, justo después del comentario inicial.