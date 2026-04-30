import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CONFIG } from "@/config";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Concretos Tepexi",
  description:
    "Aviso de privacidad simplificado sobre el tratamiento de datos personales de Concretos Tepexi.",
  robots: "index, follow",
};

export default function AvisoPrivacidadPage() {
  const mail = CONFIG.contactEmail;
  const address = CONFIG.companyAddressShort;
  const name = CONFIG.companyLegalName;

  return (
    <div className="min-h-full flex flex-col bg-[#0c0f14] text-[#ecf0f6] antialiased">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0f14]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-display font-semibold text-white tracking-wide text-sm sm:text-base hover:text-[#fecaca] transition-colors"
          >
            <span
              className="relative inline-block h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white shadow-sm"
              aria-hidden
            >
              <Image
                src="/Logo.jpg"
                alt=""
                fill
                className="object-contain"
                sizes="40px"
                priority
              />
            </span>
            CONCRETOS TEPEXI
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-[#d8e3ee] hover:text-white underline-offset-4 hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-3xl px-4 sm:px-6 py-10 md:py-14 pb-20">
        <article className="max-w-none">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide mb-2">
            Aviso de privacidad simplificado
          </h1>
          <p className="text-sm text-[#b0bcc9] mb-10">
            Última actualización:{" "}
            {new Intl.DateTimeFormat("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>

          <section className="space-y-4 mb-10 text-[#ecf0f6] leading-relaxed text-[15px] sm:text-base">
            <p>
              <strong className="text-white">{name}</strong>, en adelante &quot;el responsable&quot;, con ubicación principal
              de operación en{" "}
              <strong className="text-white">{address}</strong>, utilizará los datos personales que recaude para las finalidades
              descritas a continuación, en términos de la Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares y normatividad aplicable en materia de protección de datos en México.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-lg font-semibold text-white mb-3 tracking-wide">
              Finalidades del tratamiento
            </h2>
            <p className="text-[#ecf0f6] leading-relaxed mb-4 text-[15px] sm:text-base">
              Los datos personales que proporcione podrán ser tratados para:
            </p>
            <ol className="list-decimal list-outside ml-5 space-y-3 text-[#ecf0f6] text-[15px] sm:text-base leading-relaxed">
              <li>
                Elaborar y dar seguimiento a <strong className="text-white">cotizaciones de concreto</strong> premezclado y
                servicios relacionados con su proyecto.
              </li>
              <li>
                <strong className="text-white">Agendar visitas a las instalaciones de la empresa</strong> u operaciones relacionadas con la prestación del
                servicio.
              </li>
              <li>
                <strong className="text-white">Seguimiento comercial</strong>, comunicación relacionada con su solicitud,
                soporte técnico o administrativo, y mejorar la prestación del servicio.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-lg font-semibold text-white mb-3 tracking-wide">
              Transferencias y terceros
            </h2>
            <p className="text-[#ecf0f6] leading-relaxed text-[15px] sm:text-base">
              Sus datos están protegidos mediante medidas de seguridad físicas, administrativas y tecnológicas adecuadas al
              contexto del responsable, y{" "}
              <strong className="text-white">no serán compartidos con terceros ajenos a la operación del responsable</strong>,
              salvo que exista orden de autoridad competente o alguna obligación legal que así lo amerite.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white mb-3 tracking-wide">
              Derechos ARCO y contacto
            </h2>
            <p className="text-[#ecf0f6] leading-relaxed text-[15px] sm:text-base">
              Usted puede ejercer los derechos de{" "}
              <strong className="text-white">Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong>, así como resolver
              dudas sobre el tratamiento de sus datos, enviando un correo electrónico a{" "}
              <a
                href={`mailto:${mail}?subject=Solicitud%20relacionada%20con%20datos%20personales%20-%20ARCO`}
                className="text-white underline underline-offset-2 hover:text-[#fecaca] break-all"
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
