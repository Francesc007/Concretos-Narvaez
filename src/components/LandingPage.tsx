"use client";

import { useCallback, useState } from "react";
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

  const openCotizador = useCallback(() => setCotizadorOpen(true), []);
  const openAgendaVisita = useCallback(() => setAgendaVisitaOpen(true), []);
  const closeCotizador = useCallback(() => {
    setCotizadorOpen(false);
    setVolumenCotizadorInicial(null);
  }, []);
  const closeAgendaVisita = useCallback(() => setAgendaVisitaOpen(false), []);

  const onCotizarVolumenM3 = useCallback((m3: number) => {
    setVolumenCotizadorInicial(m3);
    setCotizadorOpen(true);
  }, []);

  return (
    <>
      <Navbar
        onCotizadorClick={openCotizador}
        onAgendaVisitaClick={openAgendaVisita}
      />
      <Hero />
      <Servicios />
      <Galeria />
      <CalculadoraVolumenConcreto onCotizarVolumenM3={onCotizarVolumenM3} />
      <Cotizacion
        onCotizadorClick={openCotizador}
        onAgendaVisitaClick={openAgendaVisita}
      />
      <Clientes imageFiles={clientesImageFiles} />
      <Footer />
      <CotizadorReservaModal
        isOpen={cotizadorOpen}
        onClose={closeCotizador}
        volumenInicialM3={volumenCotizadorInicial}
      />
      <AgendaVisitaModal isOpen={agendaVisitaOpen} onClose={closeAgendaVisita} />
      <WhatsAppButton />
    </>
  );
}
