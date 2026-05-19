# Seguridad — Concretos Narváez

## Secretos y variables de entorno

- **No** incluyas `.env`, `.env.local`, `.env.production` ni archivos JSON de credenciales de Google en el repositorio.
- Usa [`.env.example`](./.env.example) como plantilla; los valores reales van solo en tu máquina o en el panel de despliegue (Vercel, etc.).
- Si una clave o clave privada se subió por error a GitHub, **rótala de inmediato** en Google Cloud y genera una nueva cuenta de servicio o API key.

## Despliegue (Vercel u otro)

Configura estas variables en el entorno del hosting, no en el código:

| Variable | Uso |
|----------|-----|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Lectura/escritura en Google Sheets |
| `GOOGLE_PRIVATE_KEY` | Clave privada de la cuenta de servicio |
| `GOOGLE_SHEET_ID` | ID de la hoja de cotizaciones/agenda |
| `GOOGLE_CALENDAR_ID` | Calendario de visitas (si agenda activa) |
| `GOOGLE_MAPS_API_KEY` | Distancias (solo servidor) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Autocompletado en el cotizador (restringir por HTTP referrer) |

## Buenas prácticas

1. En Google Cloud, limita las API keys por dominio y por API habilitada.
2. Comparte la hoja de cálculo solo con el email de la cuenta de servicio (editor o lector según necesidad).
3. Mantén el repositorio **privado** si contiene lógica de negocio sensible.
4. Revisa los permisos del colaborador en GitHub (mínimo necesario).

## Reporte de vulnerabilidades

Para incidencias de seguridad relacionadas con este sitio, contacta a: **concretos.narvaez@gmail.com**.
