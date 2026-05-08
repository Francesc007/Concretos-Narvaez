import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const galeria = [
  "/1.jpg",
  "/2.jpg",
  "/3.jpg",
  "/4.jpg",
  "/5.jpg",
  "/6.jpg",
  "/7.jpg",
  "/8.jpg",
  "/9.JPG",
  "/logistica.jpg",
  "/Polo-Tepeji-7.jpg",
  "/22MarParqueIndustrialNuevo-10.jpg",
  "/22MarParqueIndustrialNuevo-4.jpg",
  "/CT201825-4.jpg",
  "/CT-PT-10.JPG",
];

async function tinyBlur(relFromPublic) {
  const buf = await sharp(path.join(root, "public", relFromPublic))
    .resize(16, 16, { fit: "cover" })
    .blur(6)
    .jpeg({ quality: 55 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

const entries = {};
for (const p of galeria) {
  const rel = p.replace(/^\//, "");
  entries[p] = await tinyBlur(rel);
}
const logo = await tinyBlur("Tepexi A-R.jpeg");

const out =
  `export const GALERIA_BLUR_DATA_URL: Record<string, string> = ${JSON.stringify(
    entries,
    null,
    2,
  )} as const;\n\nexport const LOGO_BLUR_DATA_URL = ${JSON.stringify(logo)} as const;\n`;

fs.writeFileSync(path.join(root, "src/lib/image-blur-placeholders.ts"), out, "utf8");
console.log("Wrote src/lib/image-blur-placeholders.ts");
