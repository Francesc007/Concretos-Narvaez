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
    destacado: true,
  },
  {
    titulo: "Bombeo y Colado",
    descripcion:
      "Coordinación de bombeo para llegar a alturas y zonas de difícil acceso, con enfoque en seguridad y continuidad del colado.",
    imagen: "/bombeo.jpg",
    icon: Cylinder,
    destacado: true,
  },
  {
    titulo: "Asesoría en Obra",
    descripcion:
      "Acompañamiento para programar volúmenes, juntas y curado. Te ayudamos a optimizar tiempos y calidad del terminado.",
    imagen: "/asesoria.jpg",
    icon: HardHat,
    destacado: false,
  },
  {
    titulo: "Entrega y Logística",
    descripcion:
      "Seguimiento de entregas acordadas con tu obra en Tepeji y zona. Comunicación clara desde el pedido hasta el camión en sitio.",
    imagen: "/logistica.jpg",
    icon: Gauge,
    destacado: false,
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
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group relative h-full min-h-[400px] overflow-hidden rounded-xl border-2 border-[#78716c]/65 bg-[#0c0f14] shadow-[inset_0_0_0_1px_rgba(120,113,108,0.18)] shadow-xl transition-[border-color,box-shadow,ring] duration-300 hover:border-[#ebe9e8] hover:shadow-[0_0_0_1px_rgba(250,250,249,0.5),0_0_36px_-4px_rgba(255,255,255,0.28)] hover:ring-2 hover:ring-white/65 cursor-default md:min-h-[440px]"
    >
      <div className="absolute inset-0 overflow-hidden shadow-[inset_0_0_0_2px_transparent] transition-[box-shadow] duration-300 group-hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.65)]">
        <img
          src={item.imagen}
          alt={item.titulo}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0f14] from-[10%] via-[#0c0f14]/70 via-[30%] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-transparent"
          aria-hidden
        />
      </div>
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#78716c]/90 bg-[#0c0f14]/85 text-[#eae9e9] shadow-sm backdrop-blur-[2px]">
          <Icon size={20} />
        </span>
        {item.destacado && (
          <span className="rounded border border-[#ffcdd2]/30 bg-[#c62828] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            Popular
          </span>
        )}
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
    <section id="servicios" className="py-20 md:py-28 bg-[#0c0f14]">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            Servicios para tu proyecto
          </h2>
          <p className="text-[#d8e3ee] max-w-2xl mx-auto">
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
