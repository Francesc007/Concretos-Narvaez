import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Imágenes de Galería (carrusel) + Servicios + histórico usado en otras secciones */
const PUBLIC_IMAGES = [
  "/1.jpg",
  "/1.2.jpg",
  "/1.3.jpg",
  "/2.jpg",
  "/2.1.jpg",
  "/2.3.jpg",
  "/3.jpg",
  "/3.1.jpg",
  "/3.2.jpg",
  "/4.jpg",
  "/4.1.jpg",
  "/4.2.jpg",
  "/5.jpg",
  "/5.1.jpg",
  "/5.2.jpg",
  "/6.jpg",
  "/6.1.jpg",
  "/6.2.jpg",
  "/7.jpg",
  "/7.1.jpg",
  "/7.2.jpg",
  "/8.jpg",
  "/8.1.jpg",
  "/8.2.jpg",
  "/9.JPG",
  "/9.1.JPG",
  "/9.2.JPG",
  "/10.jpg",
  "/10.1.jpg",
  "/10.2.jpg",
  "/11.jpg",
  "/11.1.jpg",
  "/11.2.jpg",
  "/12.jpg",
  "/12.1.jpg",
  "/12.2.jpg",
  "/13.jpg",
  "/13.1.jpg",
  "/13.2.jpg",
  "/14.jpg",
  "/14.1.jpg",
  "/14.2.jpg",
  "/15.jpg",
  "/15.1.jpg",
  "/15.2.jpg",
  "/Planta 3.jpg",
  "/bombeo.jpg",
  "/TX6.jpg",
  "/planta6.jpg",
  "/logistica.jpg",
  "/CT-PT-10.JPG",
];

async function tinyBlur(absPath) {
  const buf = await sharp(absPath).resize(16, 16, { fit: "cover" }).blur(6).jpeg({ quality: 55 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

let fallbackBlur = "";

const entries = {};
for (const p of PUBLIC_IMAGES) {
  const rel = p.replace(/^\//, "");
  const abs = path.join(root, "public", rel);
  try {
    const dataUrl = await tinyBlur(abs);
    entries[p] = dataUrl;
    if (!fallbackBlur) fallbackBlur = dataUrl;
  } catch (e) {
    console.warn("[blur]", p, e?.message ?? e);
  }
}

if (!fallbackBlur) {
  fallbackBlur = await tinyBlur(path.join(root, "public", "1.jpg"));
}

for (const p of PUBLIC_IMAGES) {
  if (!entries[p]) entries[p] = fallbackBlur;
}

const logo = await tinyBlur(path.join(root, "public", "Tepexi A-R.jpeg"));

const out = `export const GALERIA_BLUR_DATA_URL: Record<string, string> = ${JSON.stringify(entries, null, 2)} as const;

export const LOGO_BLUR_DATA_URL = ${JSON.stringify(logo)} as const;

const FALLBACK_BLUR = ${JSON.stringify(fallbackBlur)} as const;

/** Blur para \`placeholder="blur"\` en \`next/image\` (rutas bajo /public). */
export function blurDataUrlForPublicImage(src: string): string {
  return GALERIA_BLUR_DATA_URL[src] ?? FALLBACK_BLUR;
}
`;

fs.writeFileSync(path.join(root, "src/lib/image-blur-placeholders.ts"), out, "utf8");
console.log("Wrote src/lib/image-blur-placeholders.ts", Object.keys(entries).length, "placeholders");
