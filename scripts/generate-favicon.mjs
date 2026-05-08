/**
 * Genera icon.png y apple-icon.png en src/app desde el logotipo actual.
 * Ejecutar: node scripts/generate-favicon.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logo = join(root, "public", "Tepexi A-R.jpeg");
const appDir = join(root, "src", "app");

const toSquareIcon = (size) =>
  sharp(logo)
    .resize(size, size, {
      fit: "contain",
      position: "centre",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png({ compressionLevel: 9 });

async function main() {
  await toSquareIcon(256).toFile(join(appDir, "icon.png"));
  await toSquareIcon(180).toFile(join(appDir, "apple-icon.png"));
  console.log("Favicons generados: src/app/icon.png, src/app/apple-icon.png (desde Tepexi A-R.jpeg)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
