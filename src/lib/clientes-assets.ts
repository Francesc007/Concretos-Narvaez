import fs from "node:fs";
import path from "node:path";

const CLIENTES_DIR = path.join(process.cwd(), "public", "Clientes");
const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

/** Nombres de archivo en `public/Clientes` (solo imágenes). Solo importar desde Server Components u otras rutas de servidor. */
export function getClientesImageFiles(): string[] {
  try {
    const names = fs.readdirSync(CLIENTES_DIR);
    return names.filter((name) => !name.startsWith(".") && IMAGE_RE.test(name));
  } catch {
    return [];
  }
}

/**
 * Orden estable del carrusel (sin aleatoriedad).
 * El primero y el último se eligen con peso visual parecido en ranura fija para que el cierre del bucle sea menos notorio.
 */
const CLIENTES_CAROUSEL_ORDER = [
  "CFE.png",
  "Costco.png",
  "La comer.png",
  "Oxxo.png",
  "AZ.png",
  "truper.webp",
  "P&G.png",
  "kfc.webp",
  "Pilgrim´s.png",
  "Little C.png",
  "3B.jpg",
  "Marvic.png",
  "Amanali.png",
  "Arlus.png",
  "Peri.png",
  "Cerrealto.png",
  "Tubos y Barras.png",
  "Grisi.jpg",
  "under terra.gif",
  "Pemex.png",
] as const;

/** Lista ordenada para el carrusel; archivos nuevos en carpeta se añaden al final (orden alfabético). */
export function getClientesImageFilesForCarousel(): string[] {
  const inDir = new Set(getClientesImageFiles());
  const ordered: string[] = [];
  for (const name of CLIENTES_CAROUSEL_ORDER) {
    if (inDir.has(name)) ordered.push(name);
  }
  const rest = [...inDir].filter((n) => !ordered.includes(n)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...rest];
}
