/** Cache-bust del MP4 del hero (sube el número si cambias el archivo). */
export const HERO_VIDEO_VERSION = 2;

export function heroVideoSrc(): string {
  return `/Hero.mp4?v=${HERO_VIDEO_VERSION}`;
}

/** Marco representativo hasta el primer frame de video (evita destellos grises). */
export const HERO_VIDEO_POSTER = "/concreto.jpg";

export const CONFIG = {
  /**
   * WhatsApp (solo dígitos, sin + ni espacios).
   * Número: 55 4260 0590 (CDMX). En API de WhatsApp los móviles en México usan prefijo **521** + 10 dígitos,
   * no 52 solo (ese formato suele fallar o apuntar mal). Equivale a +52 1 55 4260 0590.
   */
  whatsappNumber: "5215542600590",
  /** Segundo contacto móvil por WhatsApp (773 158 5835). Formato API 521 + 10 dígitos. */
  whatsappSecondaryNumber: "5217731585835",
  /** Mismo número en formato legible */
  whatsappDisplay: "+52 55 4260 0590",
  /** Teléfono fijo en formato E.164 para `tel:` (55 1555 2097). */
  landlinePhoneE164: "+525515552097",
  googleMapsUrl:
    "https://www.google.com.mx/maps/place/Concreto+Premezclado+Tepeji/@19.8419148,-99.3478345,17z/data=!4m6!3m5!1s0x85d22516dd4e0d03:0x864669e7244384be!8m2!3d19.8419145!4d-99.3477361!16s%2Fg%2F11h07_f0h9?entry=ttu",
  facebookUrl: "https://www.facebook.com/ConcretosTepexiOficial/",
  instagramUrl: "https://www.instagram.com/tconcretos/",
  /** Mensaje predeterminado para el botón flotante de WhatsApp */
  whatsappDefaultMessage:
    "Hola Concretos Tepexi, me interesa información sobre concreto premezclado y una cotización para mi proyecto. ¿Me pueden apoyar?",
  /** Correo institucional (contacto ARCO / aviso de privacidad) */
  contactEmail: "concretos.narvaez@gmail.com",
  /** Operación declarada para avisos simplificados (ajustar a domicilio fiscal si aplica) */
  companyAddressShort: "Tepeji del Río, Estado de Hidalgo, México",
  /** Razón social o denominación utilizada en el sitio público */
  companyLegalName: "CONCRETOS TEPEXI",
};
