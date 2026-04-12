"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Truck, HardHat, Gauge, ClipboardCheck } from "lucide-react";

const servicios = [
  {
    titulo: "Concreto premezclado",
    descripcion:
      "Mezclas diseñadas según normatividad y resistencia requerida. Ideal para losas, muros, columnas y cimentaciones.",
    imagen: "/Tepexi1.jpg",
    icon: Gauge,
    destacado: true,
  },
  {
    titulo: "Bombeo y colado",
    descripcion:
      "Coordinación de bombeo para llegar a alturas y zonas de difícil acceso, con enfoque en seguridad y continuidad del colado.",
    imagen: "/Tepexi2.jpg",
    icon: Truck,
    destacado: true,
  },
  {
    titulo: "Asesoría en obra",
    descripcion:
      "Acompañamiento para programar volúmenes, juntas y curado. Te ayudamos a optimizar tiempos y calidad del terminado.",
    imagen: "/Tepexi3.jpg",
    icon: HardHat,
    destacado: false,
  },
  {
    titulo: "Entrega y logística",
    descripcion:
      "Ventanas de entrega acordadas con tu obra en Tepeji y zona. Comunicación clara desde el pedido hasta el camión en sitio.",
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
      whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)" }}
      className="bg-[#141922] rounded-xl overflow-hidden border-2 border-[#78716c]/65 hover:border-[#78716c] transition-all cursor-default shadow-[0_0_0_1px_rgba(120,113,108,0.2)]"
    >
      <div className="h-44 bg-[#0c0f14] overflow-hidden relative">
        <img src={item.imagen} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0c0f14]/85 text-[#d6d3d1] border-2 border-[#78716c]/90">
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
        <p className="text-[#94a3b8] mt-2 text-sm leading-relaxed">{item.descripcion}</p>
      </div>
    </motion.div>
  );
}

export function Servicios() {
  return (
    <section id="servicios" className="py-20 md:py-28 bg-[#0c0f14]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            Servicios para tu proyecto
          </h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto">
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
