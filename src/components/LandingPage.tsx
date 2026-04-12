"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Servicios } from "@/components/Servicios";
import { Galeria } from "@/components/Galeria";
import { Cotizacion } from "@/components/Cotizacion";
import { Footer } from "@/components/Footer";
import { CotizacionModal } from "@/components/CotizacionModal";
import { CotizadorReservaModal } from "@/components/cotizador/CotizadorReservaModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [cotizadorOpen, setCotizadorOpen] = useState(false);

  return (
    <>
      <Navbar onCotizadorClick={() => setCotizadorOpen(true)} />
      <Hero onReservasClick={() => setCotizadorOpen(true)} />
      <Servicios />
      <Galeria />
      <Cotizacion onOpenModal={() => setModalOpen(true)} />
      <Footer />
      <CotizacionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <CotizadorReservaModal isOpen={cotizadorOpen} onClose={() => setCotizadorOpen(false)} />
      <WhatsAppButton />
    </>
  );
}
