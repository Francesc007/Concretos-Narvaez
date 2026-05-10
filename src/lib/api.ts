/**
 * Base para llamadas a `/api/*` (misma origen en Next.js).
 * Opcional: `NEXT_PUBLIC_API_URL` si el front llama a otro host.
 */
export function apiUrl(path: string): string {
  const base =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL as string | undefined)?.replace(/\/$/, "")
      : undefined;
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function looksLikeHtmlResponse(contentType: string, body: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes("text/html")) return true;
  const t = body.replace(/^\uFEFF/, "").trimStart();
  if (t.startsWith("<!") || /^<\s*html[\s>]/i.test(t)) return true;
  if (t.startsWith("<") && /<(!DOCTYPE|html|head|body)\b/i.test(t.slice(0, 400))) return true;
  return false;
}

function isCrossOriginRequest(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * fetch + JSON seguro: si la respuesta es HTML (p. ej. URL mal configurada o error de Next),
 * muestra un mensaje claro en desarrollo y uno breve para el usuario en producción.
 */
export async function fetchApiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  let data: unknown;
  try {
    data = text.trim() ? JSON.parse(text) : null;
  } catch {
    if (looksLikeHtmlResponse(contentType, text)) {
      const isDev = process.env.NODE_ENV === "development";
      const crossOrigin = isCrossOriginRequest(url);

      if (typeof window !== "undefined") {
        console.error("[fetchApiJson] Respuesta HTML (se esperaba JSON)", {
          url,
          status: res.status,
          contentType,
          redirected: res.redirected,
          crossOrigin,
          preview: text.replace(/\s+/g, " ").trim().slice(0, 320),
        });
      }

      if (isDev) {
        if (crossOrigin) {
          throw new Error(
            "Las peticiones van a otro sitio (variable NEXT_PUBLIC_API_URL). Ese dominio devolvió una página web, no la API. Quita NEXT_PUBLIC_API_URL en `.env.local` para usar el mismo origen que `npm run dev`, o apunta al backend donde sí existan las rutas `/api/*`.",
          );
        }
        throw new Error(
          `El servidor devolvió HTML (${res.status}) en lugar de datos JSON. Abre la terminal de \`npm run dev\` para ver el error, y revisa \`.env.local\` (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY). En el navegador, pestaña Red: comprueba la URL exacta de la petición fallida.`,
        );
      }
      throw new Error(
        "No pudimos cargar la cotización ahora. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.",
      );
    }

    const preview = text.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(preview ? `Respuesta no válida (${res.status}): ${preview}` : `Respuesta vacía o no JSON (${res.status}).`);
  }

  if (!res.ok) {
    const err = (data as { error?: string })?.error;
    throw new Error(err || `Error ${res.status}`);
  }
  return data as T;
}
