"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Menu, X } from "lucide-react";

const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#cotizacion", label: "Cotización" },
  { href: "#ubicacion", label: "Ubicación" },
];

interface NavbarProps {
  onCotizadorClick: () => void;
}

export function Navbar({ onCotizadorClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navBarClass = `fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
    isScrolled ? "bg-[#7d7d7d]/96 border-white/25" : "bg-[#7d7d7d]/88 border-white/20"
  }`;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${navBarClass} relative`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24 py-2 gap-2 sm:gap-3">
          <a
            href="#inicio"
            className="inline-flex items-center gap-2 sm:gap-3 shrink-0 min-w-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-full border border-white bg-white p-px shadow-sm">
              <img
                src="/Logo.jpg"
                alt="Concretos Tepexi"
                className="h-full w-full rounded-full object-contain"
              />
            </div>
            <span className="font-display text-base sm:text-xl md:text-2xl font-semibold text-[#f1f5f9] tracking-wide hidden sm:inline truncate max-w-[40vw] sm:max-w-none">
              CONCRETOS TEPEXI
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[#e7e5e4] hover:text-[#c62828] transition-colors font-medium text-sm uppercase tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                onCotizadorClick();
                setMobileMenuOpen(false);
              }}
              className="font-display flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-b from-[#e53935] to-[#c62828] px-3 py-2.5 sm:px-5 sm:py-2.5 text-white shadow-lg shadow-red-900/35 ring-2 ring-white/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-red-900/40 active:scale-[0.98] uppercase text-[11px] font-bold tracking-wide sm:text-sm"
            >
              <FileText size={17} className="shrink-0 sm:w-[18px] sm:h-[18px]" />
              <span>Cotizar</span>
            </button>

            <button
              type="button"
              className="lg:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-black/10 text-white transition-colors hover:bg-black/20"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? <X size={24} strokeWidth={2.25} /> : <Menu size={24} strokeWidth={2.25} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed left-0 right-0 bottom-0 top-20 md:top-24 z-40 bg-black/25 lg:hidden"
              aria-hidden
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              id="mobile-nav-menu"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 top-full z-50 mt-2 w-[min(17.5rem,calc(100vw-1.5rem))] origin-top-right rounded-xl border border-white/25 bg-[#6a6a6a] py-2 shadow-2xl lg:hidden"
            >
              <nav className="flex flex-col gap-0.5 px-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-[#f5f5f4] transition-colors hover:bg-white/10 hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
