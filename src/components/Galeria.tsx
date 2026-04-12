"use client";

import { motion } from "framer-motion";

const items = [
  {
    titulo: "Operación y planta",
    descripcion: "Procesos controlados para consistencia en cada camión.",
    imagen: "/Tepexi1.jpg",
    borde: "border-[#78716c]/80",
  },
  {
    titulo: "Obra y colado",
    descripcion: "Mezcla lista cuando tu estructura lo necesita.",
    imagen: "/Tepexi2.jpg",
    borde: "border-[#78716c]/80",
  },
  {
    titulo: "Resultados sólidos",
    descripcion: "Concreto que respalda tus plazos y especificaciones.",
    imagen: "/Tepexi3.jpg",
    borde: "border-[#78716c]/80",
  },
];

export function Galeria() {
  return (
    <section id="galeria" className="py-20 md:py-28 bg-[#141922] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0v64M0 32h64' stroke='%23c62828' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            Galería
          </h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto">
            Un vistazo a nuestra operación y al tipo de proyectos que acompañamos en la región.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {items.map((item, i) => (
            <motion.div
              key={item.titulo}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ y: -4 }}
              className={`group bg-[#0c0f14] rounded-2xl overflow-hidden border-2 ${item.borde} shadow-[0_0_0_1px_rgba(120,113,108,0.2)] shadow-xl hover:shadow-2xl hover:shadow-[#78716c]/20 transition-shadow`}
            >
              <div className="h-56 overflow-hidden">
                <img
                  src={item.imagen}
                  alt=""
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-white mb-2 tracking-wide">
                  {item.titulo}
                </h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">{item.descripcion}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
