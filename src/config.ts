/** Vídeo de fondo del hero en /public */
export function heroVideoSrc(): string {
  return "/Concretos%20Narv%C3%A1ez.mp4";
}

/** Logotipo principal en /public */
export function logoSrc(): string {
  return "/logo.png";
}

export const CONFIG = {
  /**
   * WhatsApp (solo dígitos, sin + ni espacios).
   * Número: 55 4260 0590 (CDMX). En API de WhatsApp los móviles en México usan prefijo **521** + 10 dígitos,
   * no 52 solo (ese formato suele fallar o apuntar mal). Equivale a +52 1 55 4260 0590.
   */
  whatsappNumber: "52155 2140 4539",
  /** Segundo contacto móvil por WhatsApp (773 158 5835). Formato API 521 + 10 dígitos. */
  whatsappSecondaryNumber: "52156 1987 7440",
  /** Mismo número en formato legible */
  whatsappDisplay: "+52 55 6437 1988",
  /** Teléfono fijo en formato E.164 para `tel:` (55 1555 2097). */
  landlinePhoneE164: "+5255 7488 9773",
  googleMapsUrl:
    "https://www.google.com/maps/place/Concretos+Narvaez+Jilotepec/@19.8776495,-99.5595404,17z/data=!3m1!4b1!4m6!3m5!1s0x85d247cbb727d4bb:0x8855e731741369d6!8m2!3d19.8776495!4d-99.5569655!16s%2Fg%2F11h5s489_v?entry=ttu",
  facebookUrl: "https://www.facebook.com/ConcretosNarvaezOficial/",
  instagramUrl: "https://www.instagram.com/narvaezconcretos/",
  /** Mensaje predeterminado para el botón flotante de WhatsApp */
  whatsappDefaultMessage:
    "Buen día, escribo desde la página de Concretos Narváez. Requiero información y una cotización para mi obra. ¿Me pueden orientar?",
  /** Correo institucional (contacto ARCO / aviso de privacidad) */
  contactEmail: "narvaezconcretos.jilotepec@gmail.com",
  /** Operación declarada para avisos simplificados (ajustar a domicilio fiscal si aplica) */
  companyAddressShort: "Jilotepec, Estado de México, México",
  /** Razón social o denominación utilizada en el sitio público */
  companyLegalName: "CONCRETOS NARVÁEZ",
  /** Marca en mayúsculas/minúsculas para textos y metadatos */
  companyDisplayName: "Concretos Narváez",
  /**
   * `true`: flujo completo con agenda, capacidad y escritura en «Agenda» + «Bloqueos_Logistica».
   * `false` (stand by): solo cotización informativa + contacto; los leads van a la hoja «Cotizaciones».
   */
  cotizadorAgendaActiva: false,
};
