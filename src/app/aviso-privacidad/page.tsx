import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CONFIG } from "@/config";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Concretos Narváez",
  description:
    "Texto corto sobre tratamiento de datos personales del sitio Concretos Narváez Jilotepec: cotizaciones, visitas y contacto ARCO por correo institucional.",
  robots: "index, follow",
};

export default function AvisoPrivacidadPage() {
  const mail = CONFIG.contactEmail;
  const address = CONFIG.companyAddressShort;
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
          <h1 className="font-display mb-2 text-2xl font-bold tracking-wide text-[var(--tepexi-logo-navy)] sm:text-3xl">
            Aviso de privacidad simplificado
          </h1>
          <p className="mb-10 text-sm text-[var(--tepexi-text-muted)]">
            Última actualización:{" "}
            {new Intl.DateTimeFormat("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>

          <section className="mb-10 space-y-4 leading-relaxed text-[15px] text-[var(--tepexi-text-body)] sm:text-base">
            <p>
              <strong className="text-[var(--tepexi-logo-navy)]">{name}</strong>, en adelante &quot;el responsable&quot;, con
              ubicación principal de operación en{" "}
              <strong className="text-[var(--tepexi-logo-navy)]">{address}</strong>, utilizará los datos personales que
              recaude para las finalidades descritas a continuación, en términos de la Ley Federal de Protección de Datos
              Personales en Posesión de los Particulares y normatividad aplicable en materia de protección de datos en México.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display mb-3 text-lg font-semibold tracking-wide text-[var(--tepexi-logo-navy)]">
              Finalidades del tratamiento
            </h2>
            <p className="mb-4 leading-relaxed text-[15px] text-[var(--tepexi-text-body)] sm:text-base">
              Los datos personales que proporcione podrán ser tratados para:
            </p>
            <ol className="ml-5 list-outside list-decimal space-y-3 leading-relaxed text-[15px] text-[var(--tepexi-text-body)] sm:text-base">
              <li>
                Elaborar y dar seguimiento a{" "}
                <strong className="text-[var(--tepexi-logo-navy)]">cotizaciones de concreto</strong> premezclado y servicios
                relacionados con su proyecto.
              </li>
              <li>
                <strong className="text-[var(--tepexi-logo-navy)]">Agendar visitas a las instalaciones de la empresa</strong>{" "}
                u operaciones relacionadas con la prestación del servicio.
              </li>
              <li>
                <strong className="text-[var(--tepexi-logo-navy)]">Seguimiento comercial</strong>, comunicación relacionada con
                su solicitud, soporte técnico o administrativo, y mejorar la prestación del servicio.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="font-display mb-3 text-lg font-semibold tracking-wide text-[var(--tepexi-logo-navy)]">
              Transferencias y terceros
            </h2>
            <p className="leading-relaxed text-[15px] text-[var(--tepexi-text-body)] sm:text-base">
              Sus datos están protegidos mediante medidas de seguridad físicas, administrativas y tecnológicas adecuadas al
              contexto del responsable, y{" "}
              <strong className="text-[var(--tepexi-logo-navy)]">
                no serán compartidos con terceros ajenos a la operación del responsable
              </strong>
              , salvo que exista orden de autoridad competente o alguna obligación legal que así lo amerite.
            </p>
          </section>

          <section>
            <h2 className="font-display mb-3 text-lg font-semibold tracking-wide text-[var(--tepexi-logo-navy)]">
              Derechos ARCO y contacto
            </h2>
            <p className="leading-relaxed text-[15px] text-[var(--tepexi-text-body)] sm:text-base">
              Usted puede ejercer los derechos de{" "}
              <strong className="text-[var(--tepexi-logo-navy)]">
                Acceso, Rectificación, Cancelación y Oposición (ARCO)
              </strong>
              , así como resolver dudas sobre el tratamiento de sus datos, enviando un correo electrónico a{" "}
              <a
                href={`mailto:${mail}?subject=Solicitud%20relacionada%20con%20datos%20personales%20-%20ARCO`}
                className="font-medium text-tepexi-accent underline underline-offset-2 break-all hover:text-tepexi-accent-hover"
              >
                {mail}
              </a>
              . El responsable atenderá solicitudes dentro de los plazos previstos en la legislación aplicable.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
