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
  title: "Concretos Tepexi | Concreto premezclado en Tepeji del Río",
  description:
    "Concreto premezclado de calidad en Tepeji del Río, Hidalgo. Servicio de bombeo, asesoría técnica y entrega puntual. Solicita tu cotización por WhatsApp.",
  keywords: [
    "concreto premezclado Tepeji",
    "concretos Tepexi",
    "concreto Hidalgo",
    "bombeo de concreto",
    "cotización concreto",
  ],
  robots: "index, follow",
  openGraph: {
    title: "Concretos Tepexi | Concreto premezclado",
    description:
      "Solidez y confianza para tu obra. Concreto premezclado con respaldo técnico en la región.",
    type: "website",
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
