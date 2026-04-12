export const CONFIG = {
  /**
   * WhatsApp (solo dígitos, sin + ni espacios).
   * Número: 55 4260 0590 (CDMX). En API de WhatsApp los móviles en México usan prefijo **521** + 10 dígitos,
   * no 52 solo (ese formato suele fallar o apuntar mal). Equivale a +52 1 55 4260 0590.
   */
  whatsappNumber: "5215542600590",
  /** Mismo número en formato legible */
  whatsappDisplay: "+52 55 4260 0590",
  googleMapsUrl:
    "https://www.google.com.mx/maps/place/Concreto+Premezclado+Tepeji/@19.8419148,-99.3478345,17z/data=!4m6!3m5!1s0x85d22516dd4e0d03:0x864669e7244384be!8m2!3d19.8419145!4d-99.3477361!16s%2Fg%2F11h07_f0h9?entry=ttu",
  facebookUrl: "https://www.facebook.com/ConcretosTepexiOficial/",
  /** Mensaje predeterminado para el botón flotante de WhatsApp */
  whatsappDefaultMessage:
    "Hola Concretos Tepexi, me interesa información sobre concreto premezclado y una cotización para mi proyecto. ¿Me pueden apoyar?",
  horarios: {
    principal: "L-V 8:00 – 17:00 h · S 8:00 – 13:00 h",
  },
};
