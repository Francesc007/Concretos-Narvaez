/**
 * Genera icon.png y apple-icon.png en src/app desde el logotipo actual.
 * Fondo gris (#d6d6d6, --tepexi-logo-badge-bg); logo con ligero zoom para legibilidad en pestaña.
 * Ejecutar: node scripts/generate-favicon.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logo = join(root, "public", "logo.png");
const appDir = join(root, "src", "app");

/** Mismo gris que --tepexi-logo-badge-bg (#d6d6d6) */
const LOGO_BADGE_BG = { r: 214, g: 214, b: 214, alpha: 1 };

/** Logo ~90 % del icono (antes ~70–75 % con contain a tamaño completo). */
const LOGO_FILL = 0.9;

async function toSquareIcon(size) {
  const logoPx = Math.round(size * LOGO_FILL);
  const resized = await sharp(logo)
    .resize(logoPx, logoPx, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 3, background: LOGO_BADGE_BG },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png({ compressionLevel: 9 });
}

async function main() {
  await (await toSquareIcon(256)).toFile(join(appDir, "icon.png"));
  await (await toSquareIcon(180)).toFile(join(appDir, "apple-icon.png"));
  console.log("Favicons generados: src/app/icon.png, src/app/apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
