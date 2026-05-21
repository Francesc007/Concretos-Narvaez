import type { Metadata } from "next";
import { DM_Sans, Oswald } from "next/font/google";
import { heroVideoSrc } from "@/config";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Concretos Narváez Jilotepec | Premezclado, bombeo y suministro en Edoméx",
  description:
    "Fabricación y despacho de concreto hidráulico premezclado desde Jilotepec (Estado de México): recetas bajo normas NMX-C, bombeo y rutas para obra en Atlacomulco y zona norte del Estado de México. Cotiza por WhatsApp.",
  keywords: [
    "concreto premezclado Jilotepec",
    "premezclado Edoméx",
    "Concretos Narváez",
    "bombeo de concreto Estado de México",
    "mezclas certificadas NMX-C",
    "suministro de concreto Atlacomulco",
    "cotización concreto Jilotepec",
    "colado industrial Estado de México",
  ],
  robots: "index, follow",
  openGraph: {
    title: "Concretos Narváez — Premezclado en Jilotepec y cobertura regional",
    description:
      "Mezclas diseñadas para tu proyecto: resistencias comerciales e industriales, logística propia y asesoría en obra en la región centro-norte del Estado de México.",
    type: "website",
    locale: "es_MX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={`${dmSans.variable} ${oswald.variable} h-full antialiased`}>
      <head>
        <link rel="preload" href={heroVideoSrc()} as="video" type="video/mp4" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[var(--tepexi-page)] text-[var(--tepexi-text-body)]"
      >
        {children}
      </body>
    </html>
  );
}
