"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Servicios } from "@/components/Servicios";
import { Galeria } from "@/components/Galeria";
import { CalculadoraVolumenConcreto } from "@/components/CalculadoraVolumenConcreto";
import { Cotizacion } from "@/components/Cotizacion";
import { Clientes } from "@/components/Clientes";
import { Footer } from "@/components/Footer";
import { AgendaVisitaModal } from "@/components/AgendaVisitaModal";
import { CotizadorReservaModal } from "@/components/cotizador/CotizadorReservaModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";

type LandingPageProps = { clientesImageFiles: string[] };

export function LandingPage({ clientesImageFiles }: LandingPageProps) {
  const [cotizadorOpen, setCotizadorOpen] = useState(false);
  const [volumenCotizadorInicial, setVolumenCotizadorInicial] = useState<number | null>(null);
  const [agendaVisitaOpen, setAgendaVisitaOpen] = useState(false);

  return (
    <>
      <Navbar
        onCotizadorClick={() => setCotizadorOpen(true)}
        onAgendaVisitaClick={() => setAgendaVisitaOpen(true)}
      />
      <Hero />
      <Servicios />
      <Galeria />
      <CalculadoraVolumenConcreto
        onCotizarVolumenM3={(m3) => {
          setVolumenCotizadorInicial(m3);
          setCotizadorOpen(true);
        }}
      />
      <Cotizacion
        onCotizadorClick={() => setCotizadorOpen(true)}
        onAgendaVisitaClick={() => setAgendaVisitaOpen(true)}
      />
      <Clientes imageFiles={clientesImageFiles} />
      <Footer />
      <CotizadorReservaModal
        isOpen={cotizadorOpen}
        onClose={() => {
          setCotizadorOpen(false);
          setVolumenCotizadorInicial(null);
        }}
        volumenInicialM3={volumenCotizadorInicial}
      />
      <AgendaVisitaModal isOpen={agendaVisitaOpen} onClose={() => setAgendaVisitaOpen(false)} />
      <WhatsAppButton />
    </>
  );
}
