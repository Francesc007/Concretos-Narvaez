"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Menu, X } from "lucide-react";

const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#calculadora-volumen", label: "Calculadora" },
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

  const navBarClass =
    "fixed top-0 left-0 right-0 z-[90] w-full min-w-0 border-b border-white/25 bg-transparent backdrop-blur-sm transition-all duration-300 overflow-hidden";

  const texturaFondo: CSSProperties = {
    backgroundColor: isScrolled ? "#a8a5a0" : "#a8a5a0",
    backgroundImage: "url(/concrete-texture.svg)",
    backgroundSize: "88px 88px",
    backgroundRepeat: "repeat",
  };

  return (
    <header className={navBarClass}>
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={texturaFondo}
        aria-hidden
      />
      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24 py-2 gap-2 sm:gap-3">
          <a
            href="#inicio"
            className="inline-flex items-center gap-2 sm:gap-3 shrink-0 min-w-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-[4.25rem] md:w-[4.25rem] shrink-0 items-center justify-center rounded-full border border-white bg-white p-px shadow-sm">
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
      </motion.div>

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
              className="absolute right-3 top-full z-50 mt-2 w-[min(17.5rem,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-xl border border-white/25 py-2 shadow-2xl lg:hidden"
            >
              <div
                className="pointer-events-none absolute inset-0 -z-0"
                style={texturaFondo}
                aria-hidden
              />
              <nav className="relative z-10 flex flex-col gap-0.5 px-1" aria-label="Móvil">
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
    </header>
  );
}