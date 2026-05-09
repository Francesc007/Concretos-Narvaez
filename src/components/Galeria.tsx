"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

/** Tres vistas por proyecto; rutas bajo /public (p. ej. 1→1,1.2,1.3 / 2→2,2.1,2.3 / 3→3,3.1,3.2 …). */
const PROYECTO_IMAGENES = [
  ["/1.jpg", "/1.2.jpg", "/1.3.jpg"],
  ["/2.jpg", "/2.1.jpg", "/2.3.jpg"],
  ["/3.jpg", "/3.1.jpg", "/3.2.jpg"],
  ["/4.jpg", "/4.1.jpg", "/4.2.jpg"],
  ["/5.jpg", "/5.1.jpg", "/5.2.jpg"],
  ["/6.jpg", "/6.1.jpg", "/6.2.jpg"],
  ["/7.jpg", "/7.1.jpg", "/7.2.jpg"],
  ["/8.jpg", "/8.1.jpg", "/8.2.jpg"],
  ["/9.JPG", "/9.1.JPG", "/9.2.JPG"],
  ["/10.jpg", "/10.1.jpg", "/10.2.jpg"],
  ["/11.jpg", "/11.1.jpg", "/11.2.jpg"],
  ["/12.jpg", "/12.1.jpg", "/12.2.jpg"],
  ["/13.jpg", "/13.1.jpg", "/13.2.jpg"],
  ["/14.jpg", "/14.1.jpg", "/14.2.jpg"],
  ["/15.jpg", "/15.1.jpg", "/15.2.jpg"],
] as const;

const SLIDE_INTERVAL_MS = 4500;

const items = [
  {
    titulo: "Acceso B Central Park 57, Tepeji del Río, Hgo.",
    imagenes: PROYECTO_IMAGENES[0],
  },
  {
    titulo: "Muro de contención en Autopista Méx-Qro.",
    imagenes: PROYECTO_IMAGENES[1],
  },
  {
    titulo: "Cimentación en Farmaceútica, Parque Industrial Tepeji del Río, Hgo.",
    imagenes: PROYECTO_IMAGENES[2],
  },
  {
    titulo: "Suministro de Vialidades principales, Hgo.",
    imagenes: PROYECTO_IMAGENES[3],
  },
  {
    titulo: "Parque QUMA, Huehuetoca, Edo. Méx.",
    imagenes: PROYECTO_IMAGENES[4],
  },
  {
    titulo: "Parque QUMA, Huehuetoca, Edo. Méx.",
    imagenes: PROYECTO_IMAGENES[5],
  },
  {
    titulo: "Bombeo plaza comercial, Huehuetla, Hgo.",
    imagenes: PROYECTO_IMAGENES[6],
  },
  {
    titulo: "Zapatas y nivelación, Tecozautla, Hgo.",
    imagenes: PROYECTO_IMAGENES[7],
  },
  {
    titulo: "Área institucional, Chilcuautla, Hgo.",
    imagenes: PROYECTO_IMAGENES[8],
  },
  {
    titulo: "Logística y entrega programada en sitio, zona Tepeji.",
    imagenes: PROYECTO_IMAGENES[9],
  },
  {
    titulo: "Desarrollo Polo Tepeji, Tepeji del Río, Hgo.",
    imagenes: PROYECTO_IMAGENES[10],
  },
  {
    titulo: "Parque industrial, Tepeji del Río, Hgo.",
    imagenes: PROYECTO_IMAGENES[11],
  },
  {
    titulo: "Vialidades y obra civil, parque industrial Tepeji del Río, Hgo.",
    imagenes: PROYECTO_IMAGENES[12],
  },
  {
    titulo: "Colado y bombeo en proyecto de concreto, zona metropolitana.",
    imagenes: PROYECTO_IMAGENES[13],
  },
  {
    titulo: "Piso y acabado en planta, Tepeji del Río, Hgo.",
    imagenes: PROYECTO_IMAGENES[14],
  },
] as const;

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "tween" as const, duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

type Proyecto = (typeof items)[number];

const ProyectoCardContent = memo(function ProyectoCardContent({
  item,
  index,
  activeSlide,
}: {
  item: Proyecto;
  index: number;
  activeSlide: number;
}) {
  return (
    <>
      <div className="relative h-64 overflow-hidden sm:h-72">
        <div className="relative h-full w-full origin-center transition-transform duration-500 ease-out max-md:group-hover:scale-[1.03] group-hover:scale-105">
          {item.imagenes.map((src, slideIdx) => (
            <Image
              key={src}
              src={src}
              alt={item.titulo}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              placeholder="empty"
              className={`object-cover object-center transition-opacity ease-in-out duration-[900ms] ${
                slideIdx === activeSlide ? "opacity-100 z-[1]" : "opacity-0 z-0"
              }`}
              loading={index < 3 ? "eager" : "lazy"}
              priority={index < 2 && slideIdx === 0}
            />
          ))}
        </div>
      </div>
      <div className="px-4 py-3 sm:py-3.5">
        <h3 className="font-display text-base font-semibold tracking-wide leading-snug text-[var(--tepexi-logo-navy)] sm:text-lg">
          {item.titulo}
        </h3>
      </div>
    </>
  );
});

export function Galeria() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((s) => (s + 1) % 3);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      id="proyectos"
      className="relative overflow-hidden border-y border-[var(--tepexi-border-light)] bg-white py-20 md:py-28"
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0v64M0 32h64' stroke='%23132f4c' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--tepexi-logo-navy)] mb-4 tracking-wide">
            Proyectos
          </h2>
          <p className="text-[var(--tepexi-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Un vistazo a nuestra operación y al tipo de proyectos que acompañamos en la región.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8 lg:gap-10"
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08, margin: "0px 0px -10% 0px" }}
        >
          {items.map((item, i) => (
            <motion.article
              key={`${item.titulo}-${i}`}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.985 }}
              className="group rounded-2xl overflow-hidden border-2 border-[#c62828]/120 bg-white shadow-lg transition-[border-color,box-shadow,ring] duration-300 hover:border-[#c62828]/120 hover:shadow-md hover:ring-2 hover:ring-[#c62828]/15 transform-gpu"
            >
              <ProyectoCardContent item={item} index={i} activeSlide={activeSlide} />
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
