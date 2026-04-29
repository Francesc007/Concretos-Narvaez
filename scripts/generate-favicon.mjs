/**
 * Genera icon.png y apple-icon.png en src/app desde public/Logo.jpg
 * Ejecutar: node scripts/generate-favicon.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logo = join(root, "public", "Logo.jpg");
const appDir = join(root, "src", "app");

const resize = (width, height) =>
  sharp(logo).resize(width, height, {
    fit: "cover",
    position: "centre",
  });

async function main() {
  await resize(256, 256).png({ compressionLevel: 9 }).toFile(join(appDir, "icon.png"));
  await resize(180, 180).png({ compressionLevel: 9 }).toFile(join(appDir, "apple-icon.png"));
  console.log("Favicons generados: src/app/icon.png, src/app/apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
