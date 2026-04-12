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

/**
 * fetch + JSON seguro: si la respuesta es HTML, el mensaje indica cómo corregirlo.
 */
export async function fetchApiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    const t = text.replace(/\s+/g, " ").trim();
    const looksHtml = t.startsWith("<") || /server error/i.test(t);
    if (looksHtml) {
      throw new Error(
        "La API respondió con HTML en lugar de JSON. Revisa que `npm run dev` esté activo, las variables GOOGLE_* en .env.local y la consola del servidor.",
      );
    }
    throw new Error(`Respuesta no JSON (${res.status}): ${t.slice(0, 180)}`);
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error;
    throw new Error(err || `Error ${res.status}`);
  }
  return data as T;
}
