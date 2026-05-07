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

export function shuffleArray<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
