"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Truck, HardHat, Gauge, ClipboardCheck } from "lucide-react";

const servicios = [
  {
    titulo: "Concreto Premezclado",
    descripcion:
      "Mezclas diseñadas según normatividad y resistencia requerida. Ideal para losas, muros, columnas y cimentaciones.",
    imagen: "/Tepexi1.jpg",
    icon: Gauge,
    destacado: true,
  },
  {
    titulo: "Bombeo y Colado",
    descripcion:
      "Coordinación de bombeo para llegar a alturas y zonas de difícil acceso, con enfoque en seguridad y continuidad del colado.",
    imagen: "/Tepexi2.jpg",
    icon: Truck,
    destacado: true,
  },
  {
    titulo: "Asesoría en Obra",
    descripcion:
      "Acompañamiento para programar volúmenes, juntas y curado. Te ayudamos a optimizar tiempos y calidad del terminado.",
    imagen: "/Tepexi3.jpg",
    icon: HardHat,
    destacado: false,
  },
  {
    titulo: "Entrega y Logística",
    descripcion:
      "Seguimiento de entregas acordadas con tu obra en Tepeji y zona. Comunicación clara desde el pedido hasta el camión en sitio.",
    imagen: "/Hero.jpg",
    icon: ClipboardCheck,
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
      className="group bg-[#141922] rounded-xl overflow-hidden border-2 border-[#78716c]/65 shadow-[inset_0_0_0_1px_rgba(120,113,108,0.18)] shadow-xl transition-[border-color,box-shadow,ring] duration-300 hover:border-[#ebe9e8] hover:shadow-[0_0_0_1px_rgba(250,250,249,0.5),0_0_36px_-4px_rgba(255,255,255,0.28)] hover:ring-2 hover:ring-white/65 cursor-default"
    >
      <div className="relative h-44 bg-[#0c0f14] overflow-hidden shadow-[inset_0_0_0_2px_transparent] transition-[box-shadow] duration-300 group-hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.65)]">
        <img src={item.imagen} alt="" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0c0f14]/85 text-[#eae9e9] border-2 border-[#78716c]/90">
            <Icon size={20} />
          </span>
          {item.destacado && (
            <span className="text-xs font-semibold uppercase tracking-wide bg-[#c62828] text-white px-2 py-1 rounded border border-[#ffcdd2]/30">
              Popular
            </span>
          )}
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-display text-xl font-semibold text-white tracking-wide">{item.titulo}</h3>
        <p className="text-[#d8e3ee] mt-2 text-sm leading-relaxed">{item.descripcion}</p>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {servicios.map((item, i) => (
            <ServicioCard key={item.titulo} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
