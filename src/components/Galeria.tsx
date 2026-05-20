"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { blurDataUrlForPublicImage } from "@/lib/image-blur-placeholders";

/** Una imagen fija por proyecto bajo /public. */
const PROYECTO_IMAGENES = [
  "/Jilo1.jpg",
  "/Jilo5.jpg",
  "/Jilo7.jpg",
  "/Jilo8.jpg",
  "/Jilo9.jpg",
  "/6.jpg",
  "/7.jpg",
  "/8.jpg",
  "/9.JPG",
] as const;

const items = [
  {
    titulo: "Central Park 57, Tepeji del Río, Hgo.",
    imagen: PROYECTO_IMAGENES[0],
  },
  {
    titulo: "Muro de Contención en Autopista Méx-Qro.",
    imagen: PROYECTO_IMAGENES[1],
  },
  {
    titulo: "Cimentación en Farmaceútica, Parque Industrial Tepeji del Río, Hgo.",
    imagen: PROYECTO_IMAGENES[2],
  },
  {
    titulo: "Colado Masivo Pericimbras, Parque de las Américas, Huehuetoca, Edo. Méx.",
    imagen: PROYECTO_IMAGENES[3],
  },
  {
    titulo: "Parque QUMA, Huehuetoca, Edo. Méx.",
    imagen: PROYECTO_IMAGENES[4],
  },
  {
    titulo: "Terminal Tepeji del Río, Parque Industrial Tepeji del Río, Hgo.",
    imagen: PROYECTO_IMAGENES[5],
  },
  {
    titulo: "Naves Industriales Marvic Ingeniería, Tepeji del Río, Hgo.",
    imagen: PROYECTO_IMAGENES[6],
  },
  {
    titulo: "Zapatas y nivelación, Tecozautla, Hgo.",
    imagen: PROYECTO_IMAGENES[7],
  },
  {
    titulo: "Tubos y Barras Huecas, Parque Industrial Tepeji del Río, Tepeji del Río, Hgo.",
    imagen: PROYECTO_IMAGENES[8],
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

const ProyectoCardContent = memo(function ProyectoCardContent({ item }: { item: Proyecto }) {
  return (
    <>
      <div className="relative h-64 overflow-hidden sm:h-72">
        <div className="relative h-full w-full origin-center transition-transform duration-500 ease-out max-md:group-hover:scale-[1.03] group-hover:scale-105">
          <Image
            src={item.imagen}
            alt={item.titulo}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={75}
            placeholder="blur"
            blurDataURL={blurDataUrlForPublicImage(item.imagen)}
            loading="lazy"
            className="object-cover object-center"
          />
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
  return (
    <section
      id="proyectos"
      className="relative overflow-hidden border-y border-[var(--tepexi-border-light)] bg-white py-20 md:py-28"
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0v64M0 32h64' stroke='%233d3d3d' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
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
            Nuestros Proyectos de obra en la región
          </h2>
          <p className="text-[var(--tepexi-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Galería ilustrativa de colados industriales, urbanos y comerciales donde se ha aplicado concreto premezclado en
            proyectos cercanos en el Estado de México e Hidalgo.
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
              className="group rounded-2xl overflow-hidden border-2 border-tepexi-accent/90 bg-white shadow-lg transition-[border-color,box-shadow,ring] duration-300 hover:border-tepexi-accent/90 hover:shadow-md hover:ring-2 hover:ring-tepexi-accent/15 transform-gpu"
            >
              <ProyectoCardContent item={item} />
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
