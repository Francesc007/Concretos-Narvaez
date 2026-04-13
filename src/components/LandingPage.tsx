"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Servicios } from "@/components/Servicios";
import { Galeria } from "@/components/Galeria";
import { Cotizacion } from "@/components/Cotizacion";
import { Footer } from "@/components/Footer";
import { AgendaVisitaModal } from "@/components/AgendaVisitaModal";
import { CotizadorReservaModal } from "@/components/cotizador/CotizadorReservaModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function LandingPage() {
  const [cotizadorOpen, setCotizadorOpen] = useState(false);
  const [agendaVisitaOpen, setAgendaVisitaOpen] = useState(false);

  return (
    <>
      <Navbar onCotizadorClick={() => setCotizadorOpen(true)} />
      <Hero />
      <Servicios />
      <Galeria />
      <Cotizacion
        onCotizadorClick={() => setCotizadorOpen(true)}
        onAgendaVisitaClick={() => setAgendaVisitaOpen(true)}
      />
      <Footer />
      <CotizadorReservaModal isOpen={cotizadorOpen} onClose={() => setCotizadorOpen(false)} />
      <AgendaVisitaModal isOpen={agendaVisitaOpen} onClose={() => setAgendaVisitaOpen(false)} />
      <WhatsAppButton />
    </>
  );
}
