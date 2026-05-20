import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CONFIG } from "@/config";

export const metadata: Metadata = {
  title: "Política de calidad | Concretos Narváez",
  description:
    "Enfoque de CONCRETOS NARVÁEZ en gestión de calidad del CH premezclado: cumplimiento normativo, seguimiento al cliente y mejora continua operativa.",
  robots: "index, follow",
};

export default function PoliticaCalidadPage() {
  const name = CONFIG.companyLegalName;

  return (
    <div className="min-h-full flex flex-col bg-[var(--tepexi-page)] text-[var(--tepexi-text-body)] antialiased">
      <header className="sticky top-0 z-20 border-b border-[var(--tepexi-border-light)] bg-white shadow-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-[var(--tepexi-logo-navy)] transition-colors hover:text-tepexi-accent sm:text-base"
          >
            <span
              className="relative inline-block h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-full border-2 border-[var(--tepexi-logo-navy)] bg-white shadow-sm"
              aria-hidden
            >
              <Image
                src="/C%20Narvaez.jpg"
                alt=""
                fill
                className="object-contain"
                sizes="40px"
                priority
              />
            </span>
            {name}
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-[var(--tepexi-text-muted)] underline-offset-4 hover:text-tepexi-accent hover:underline sm:text-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-3xl px-4 sm:px-6 py-10 md:py-14 pb-20">
        <article className="max-w-none">
          <h1 className="font-display mb-8 text-2xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-3xl">
            Política de calidad
          </h1>

          <div className="space-y-6 leading-relaxed text-[15px] text-[var(--tepexi-text-body)] sm:text-base">
            <p>
              <strong className="text-[var(--tepexi-logo-navy)]">{name}</strong> es una empresa mexicana
              especializada en la fabricación, transporte y entrega de Concreto Hidráulico Premezclado para la industria
              de la construcción; elaboramos productos con la más alta calidad exigida en las normas de calidad vigentes.
            </p>
            <p>
              Nuestro mayor compromiso es satisfacer las necesidades de nuestros clientes, basado en la atención
              personalizada, en la experiencia de nuestros colaboradores, al trabajo en equipo, a la mejora continua de
              nuestros procesos y a la visión entusiasta y cálida de la Alta Dirección.
            </p>
            <p>
              La calidez de la empresa permite que nuestros clientes sean parte importante de nuestro desarrollo, siendo
              esto la diferencia con nuestros competidores.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
