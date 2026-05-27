"use client";

import { useState, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, FileText, Menu, X } from "lucide-react";
import { LOGO_BLUR_DATA_URL } from "@/lib/image-blur-placeholders";
import { CONFIG, logoSrc } from "@/config";

type NavLink = {
  href: string;
  label: string;
  /** Si existe, el clic abre Maps (misma lógica que el footer) en lugar de navegar por ancla. */
  mapsUrl?: string;
};

const navLinks: NavLink[] = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#calculadora-volumen", label: "Calculadora" },
  { href: "#ubicacion", label: "Ubicación", mapsUrl: CONFIG.googleMapsUrl },
];

interface NavbarProps {
  onCotizadorClick: () => void;
  onAgendaVisitaClick: () => void;
}

export function Navbar({ onCotizadorClick, onAgendaVisitaClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const [activeHref, setActiveHref] = useState("#inicio");
  const activeHrefRef = useRef(activeHref);
  activeHrefRef.current = activeHref;

  useLayoutEffect(() => {
    const headerReserve = 110;
    let raf = 0;

    const computeActive = () => {
      let current = navLinks[0].href;
      const y = window.scrollY + headerReserve;
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);

      for (const { href } of navLinks) {
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (y >= top - 4) current = href;
      }

      if (maxScroll > 0 && window.scrollY >= maxScroll - 16) {
        current = navLinks[navLinks.length - 1]!.href;
      }

      return current;
    };

    const flush = () => {
      raf = 0;
      const next = computeActive();
      if (next !== activeHrefRef.current) setActiveHref(next);
    };

    const schedule = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(flush);
    };

    flush();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", flush);

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", flush);
    };
  }, []);

  const navBarClass =
    "tepexi-nav-shell fixed top-0 left-0 right-0 z-[90] w-full min-w-0 border-b border-[var(--tepexi-logo-navy)]/25 bg-[color:color-mix(in_srgb,var(--tepexi-nav-bg)_94%,transparent)] transition-colors duration-300";

  const texturaFondo: CSSProperties = {
    backgroundColor: "var(--tepexi-nav-bg)",
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
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-20 w-full min-w-0 items-center justify-between gap-2 py-2 sm:gap-3 md:h-24">
          <a
            href="#inicio"
            className="inline-flex items-center gap-2 sm:gap-3 shrink-0 min-w-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src={logoSrc()}
              alt={CONFIG.companyDisplayName}
              width={240}
              height={240}
              priority
              quality={90}
              placeholder="blur"
              blurDataURL={LOGO_BLUR_DATA_URL}
              sizes="(max-width: 768px) 6rem, 7rem"
              className="h-[6rem] w-[6rem] shrink-0 object-contain object-center md:h-[7rem] md:w-[7rem]"
            />
          </a>

          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            {navLinks.map((link) => {
              const active = activeHref === link.href;
              const dest = link.mapsUrl ?? link.href;
              const isMaps = Boolean(link.mapsUrl);
              return (
                <a
                  key={link.href}
                  href={dest}
                  target={isMaps ? "_blank" : undefined}
                  rel={isMaps ? "noopener noreferrer" : undefined}
                  aria-label={isMaps ? "Abrir ubicación en Google Maps" : undefined}
                  className={`font-display text-base font-semibold uppercase tracking-wide transition-colors ${
                    active
                      ? "text-tepexi-accent"
                      : "text-[var(--tepexi-logo-navy)] hover:text-tepexi-accent"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onCotizadorClick();
                setMobileMenuOpen(false);
              }}
              className="font-display flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-transparent bg-gradient-to-b from-tepexi-accent-hover to-tepexi-accent px-3 py-2.5 text-white shadow-md shadow-red-950/25 ring-1 ring-white/30 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] uppercase text-[11px] font-bold tracking-wide sm:px-5 sm:text-sm"
            >
              <FileText size={17} className="shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden />
              <span>Cotizar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAgendaVisitaClick();
                setMobileMenuOpen(false);
              }}
              className="font-display flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-white/90 bg-white px-3 py-2.5 text-[var(--tepexi-logo-navy)] shadow-sm transition-all hover:border-tepexi-accent/50 hover:bg-white hover:text-tepexi-accent hover:shadow-md active:scale-[0.98] uppercase text-[11px] font-bold tracking-wide sm:border-[var(--tepexi-logo-navy)]/25 sm:px-5 sm:text-sm"
            >
              <Calendar size={17} className="shrink-0 text-tepexi-accent sm:h-[18px] sm:w-[18px]" aria-hidden />
              <span>Agenda</span>
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
                className="pointer-events-none absolute inset-0 z-0"
                style={texturaFondo}
                aria-hidden
              />
              <nav className="relative z-10 flex flex-col gap-0.5 px-1" aria-label="Móvil">
                {navLinks.map((link) => {
                  const active = activeHref === link.href;
                  const dest = link.mapsUrl ?? link.href;
                  const isMaps = Boolean(link.mapsUrl);
                  return (
                    <a
                      key={link.href}
                      href={dest}
                      target={isMaps ? "_blank" : undefined}
                      rel={isMaps ? "noopener noreferrer" : undefined}
                      aria-label={isMaps ? "Abrir ubicación en Google Maps" : undefined}
                      className={`rounded-lg px-4 py-3 text-left font-display text-base font-semibold uppercase tracking-wide transition-colors ${
                        active
                          ? "bg-white/10 text-tepexi-accent"
                          : "text-[var(--tepexi-logo-navy)] hover:bg-white/15 hover:text-tepexi-accent"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}