"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Truck, FlaskConical, Gauge, Cylinder } from "lucide-react";
import { blurDataUrlForPublicImage } from "@/lib/image-blur-placeholders";

const servicios = [
  {
    titulo: "Concreto Hidráulico Premezclado Certificado",
    descripcion:
      "Dosificación controlada en planta y registro de resistencias según normas NMX-C aplicables; orientamos la curva de elaboración para tu especificación de obra.",
    imagen: "/Planta 3.jpg",
    icon: Truck,
  },
  {
    titulo: "Bombeo y Vaciado Programado",
    descripcion:
      "Equipos para altura y frentes angostos; enlazamos bomba con rutas internas para reducir esperas en sitio y mantener la calidad de la mezcla.",
    imagen: "/bombeo.jpg",
    icon: Cylinder,
  },
  {
    titulo: "Despacho con flota propia",
    descripcion:
      "Ventanas horarias coordinadas contigo y tu cuadrilla; salimos desde planta Jilotepec con trayectos pensados para obra en Edo. Méx. y municipios cercanos.",
    imagen: "/TX6.jpg",
    icon: Gauge,
  },
  {
    titulo: "Pruebas de laboratorio",
    descripcion:
      "Contamos con laboratorio propio para ensayos de resistencia, revenimiento y control de calidad de la mezcla; respaldamos tu obra con resultados documentados.",
    imagen: "/planta6.jpg",
    icon: FlaskConical,
  },
];

function ServicioCard({
  item,
  index,
}: {
  item: (typeof servicios)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 44, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className="group relative h-full min-h-[320px] overflow-hidden rounded-xl border-2 border-tepexi-accent/90 bg-white shadow-lg transition-[border-color,box-shadow,ring] duration-300 hover:border-tepexi-accent/90 hover:shadow-md hover:ring-2 hover:ring-tepexi-accent/15 cursor-default sm:min-h-[380px] md:min-h-[440px] lg:min-h-[480px]"
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="relative h-full w-full">
          <Image
            src={item.imagen}
            alt={item.titulo}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
            quality={75}
            placeholder="blur"
            blurDataURL={blurDataUrlForPublicImage(item.imagen)}
            className="object-cover object-center transition-transform duration-500 ease-out max-md:group-hover:scale-[1.03] group-hover:scale-[1.04]"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(61,61,61,0.96)_0%,rgba(61,61,61,0.52)_20%,rgba(61,61,61,0.14)_50%,transparent_100%)]"
          aria-hidden
        />
      </div>
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/40 bg-white text-[var(--tepexi-logo-navy)] shadow-md">
          <Icon size={20} />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-6 sm:p-6">
        <h3 className="font-display text-xl font-semibold tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
          {item.titulo}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#eef3f8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
          {item.descripcion}
        </p>
      </div>
    </motion.div>
  );
}

export function Servicios() {
  return (
    <section
      id="servicios"
      className="border-y border-[var(--tepexi-border-light)] bg-[var(--tepexi-section-gray)] py-20 md:py-28"
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--tepexi-logo-navy)] mb-4 tracking-wide">
            Capacidades para obra desde planta Jilotepec
          </h2>
          <p className="text-[var(--tepexi-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Fabricación premezclada, distribución en camión mixer y pruebas de laboratorio—todo integrado para que tu
            vaciado siga la marcha prevista sin sacrificar especificación ni seguridad.
          </p>
        </motion.div>

        <div className="grid auto-rows-fr grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 md:gap-8">
          {servicios.map((item, i) => (
            <ServicioCard key={item.titulo} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
