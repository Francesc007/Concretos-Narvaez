import type { NextConfig } from "next";

/**
 * Imágenes: calidad 75 acorde a `quality={75}` en `next/image`.
 * `remotePatterns`: despliegues en Vercel (`*.vercel.app`). Las rutas en /public no lo requieren;
 * si sirves imágenes desde un dominio propio/CDN, añade otro patrón con ese hostname.
 */
const nextConfig: NextConfig = {
  images: {
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.vercel.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
