"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Truck, HardHat, Gauge, Cylinder } from "lucide-react";

const servicios = [
  {
    titulo: "Concreto Premezclado",
    descripcion:
      "Mezclas diseñadas según normatividad y resistencia requerida. Ideal para losas, muros, columnas y cimentaciones.",
    imagen: "/concreto.jpg",
    icon: Truck,
  },
  {
    titulo: "Bombeo y Colado",
    descripcion:
      "Coordinación de bombeo para llegar a alturas y zonas de difícil acceso, con enfoque en seguridad y continuidad del colado.",
    imagen: "/bombeo.jpg",
    icon: Cylinder,
  },
  {
    titulo: "Asesoría en Obra",
    descripcion:
      "Acompañamiento para programar volúmenes, juntas y curado. Te ayudamos a optimizar tiempos y calidad del terminado.",
    imagen: "/asesoria.jpg",
    icon: HardHat,
  },
  {
    titulo: "Entrega y Logística",
    descripcion:
      "Seguimiento de entregas acordadas con tu obra en Tepeji y zona. Comunicación clara desde el pedido hasta el camión en sitio.",
    imagen: "/logistica.jpg",
    icon: Gauge,
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
      className="group relative h-full min-h-[400px] overflow-hidden rounded-xl border-2 border-[#c62828]/120 bg-white shadow-lg transition-[border-color,box-shadow,ring] duration-300 hover:border-[#c62828]/120 hover:shadow-md hover:ring-2 hover:ring-[#c62828]/15 cursor-default md:min-h-[440px]"
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <img
          src={item.imagen}
          alt={item.titulo}
          className="h-full w-full object-cover transition-transform duration-500 ease-out max-md:group-hover:scale-[1.03] group-hover:scale-[1.04]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(19,47,76,0.96)_0%,rgba(19,47,76,0.5)_20%,rgba(19,47,76,0.12)_50%,transparent_100%)]"
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
            Servicios para tu proyecto
          </h2>
          <p className="text-[var(--tepexi-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Cubrimos desde la mezcla hasta la puesta en obra, con el respaldo de un equipo enfocado
            en resultados duraderos.
          </p>
        </motion.div>

        <div className="grid auto-rows-fr gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {servicios.map((item, i) => (
            <ServicioCard key={item.titulo} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
