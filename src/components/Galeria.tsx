"use client";

import { motion } from "framer-motion";

const items = [
  {
    titulo: "Colado de vialidades, Tepeji del Río, Hgo.",
    imagen: "/1.jpg",
  },
  {
    titulo: "Cimentaciones industriales, Tula de Allende, Hgo.",
    imagen: "/2.jpg",
  },
  {
    titulo: "Patio de maniobras, Apaxco, Hgo.",
    imagen: "/3.jpg",
  },
  {
    titulo: "Nivelación de lámina, Soyaniquilpan de Juárez, Hgo.",
    imagen: "/4.jpg",
  },
  {
    titulo: "Rampas de accesibilidad, Tepeji del Río, Hgo.",
    imagen: "/5.jpg",
  },
  {
    titulo: "Obra habitacional, Atotonilco de Tula, Hgo.",
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

      <div className="relative mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            Galería
          </h2>
          <p className="text-[#d8e3ee] max-w-2xl mx-auto">
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
              className="group bg-[#0c0f14] rounded-2xl overflow-hidden border-2 border-[#78716c]/65 shadow-[inset_0_0_0_1px_rgba(120,113,108,0.18)] shadow-xl transition-[border-color,box-shadow,ring] duration-300 max-md:border-[#c62828]/45 max-md:shadow-[inset_0_0_0_1px_rgba(198,40,40,0.35),0_0_28px_-8px_rgba(198,40,40,0.4)] hover:border-[#ebe9e8] hover:shadow-[0_0_0_1px_rgba(250,250,249,0.5),0_0_36px_-4px_rgba(255,255,255,0.28)] hover:ring-2 hover:ring-white/65"
            >
              <div className="relative h-56 overflow-hidden shadow-[inset_0_0_0_2px_transparent] transition-[box-shadow] duration-300 max-md:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] group-hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.65)]">
                <img
                  src={item.imagen}
                  alt=""
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out max-md:group-hover:scale-[1.03] group-hover:scale-105"
                />
              </div>
              <div className="p-5 pt-4">
                <h3 className="font-display text-lg sm:text-xl font-semibold text-white tracking-wide leading-snug">
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
