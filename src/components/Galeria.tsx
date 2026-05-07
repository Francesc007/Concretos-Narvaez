"use client";

import { motion } from "framer-motion";

const items = [
  {
    titulo: "Acceso B Central Park 57, Tepeji del Río, Hgo.",
    imagen: "/1.jpg",
  },
  {
    titulo: "Muro de contención en Autopista Méx-Qro.",
    imagen: "/2.jpg",
  },
  {
    titulo: "Cimentación en Farmaceútica, Parque Industrial Tepeji del Río, Hgo.",
    imagen: "/3.jpg",
  },
  {
    titulo: "Suministro de Vialidades principales, Hgo.",
    imagen: "/4.jpg",
  },
  {
    titulo: "Parque QUMA, Huehuetoca, Edo. Méx.",
    imagen: "/5.jpg",
  },
  {
    titulo: "Parque QUMA, Huehuetoca, Edo. Méx.",
    imagen: "/6.jpg",
  },
  {
    titulo: "Bombeo plaza comercial, Huehuetla, Hgo.",
    imagen: "/7.jpg",
  },
  {
    titulo: "Zapatas y nivelación, Tecozautla, Hgo.",
    imagen: "/8.jpg",
  },
  {
    titulo: "Área institucional, Chilcuautla, Hgo.",
    imagen: "/9.JPG",
  },
  {
    titulo: "Logística y entrega programada en sitio, zona Tepeji.",
    imagen: "/logistica.jpg",
  },
  {
    titulo: "Desarrollo Polo Tepeji, Tepeji del Río, Hgo.",
    imagen: "/Polo-Tepeji-7.jpg",
  },
  {
    titulo: "Parque industrial, Tepeji del Río, Hgo.",
    imagen: "/22MarParqueIndustrialNuevo-10.jpg",
  },
  {
    titulo: "Vialidades y obra civil, parque industrial Tepeji del Río, Hgo.",
    imagen: "/22MarParqueIndustrialNuevo-4.jpg",
  },
  {
    titulo: "Colado y bombeo en proyecto de concreto, zona metropolitana.",
    imagen: "/CT201825-4.jpg",
  },
  {
    titulo: "Piso y acabado en planta, Tepeji del Río, Hgo.",
    imagen: "/CT-PT-10.JPG",
  },
];

export function Galeria() {
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

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {items.map((item, i) => (
            <motion.div
              key={`${item.titulo}-${i}`}
              initial={{ opacity: 0, y: 36, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 320, damping: 26 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.985 }}
              className="group rounded-2xl overflow-hidden border-2 border-[#c62828]/40 bg-white shadow-lg transition-[border-color,box-shadow,ring] duration-300 hover:border-[#c62828]/60 hover:shadow-xl hover:ring-2 hover:ring-[#c62828]/15"
            >
              <div className="relative h-64 sm:h-72 overflow-hidden">
                <img
                  src={item.imagen}
                  alt=""
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out max-md:group-hover:scale-[1.03] group-hover:scale-105"
                />
              </div>
              <div className="px-4 py-3 sm:py-3.5">
                <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--tepexi-logo-navy)] tracking-wide leading-snug">
                  {item.titulo}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
