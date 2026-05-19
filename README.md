# Concretos Narváez — Sitio web

Landing y herramientas comerciales para **Concretos Narváez** (Jilotepec, Estado de México): servicios de premezclado, galería de proyectos, calculadora de volumen, cotización y agenda de visitas.

Stack: [Next.js](https://nextjs.org) 16, React 19, Tailwind CSS 4, Framer Motion.

## Requisitos

- Node.js 20+
- npm 10+

## Instalación local

```bash
git clone https://github.com/Francesc007/Concretos-Narvaez.git
cd Concretos-Narvaez
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales (ver SECURITY.md)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |
| `npm run generate-favicon` | Regenera iconos desde `public/C Narvaez.jpg` |
| `npm run generate-image-blurs` | Regenera placeholders blur de imágenes |

## Configuración

- Datos públicos (WhatsApp, redes, textos legales): `src/config.ts`
- Variables secretas: `.env.local` (ver `.env.example`)
- Seguridad y despliegue: [SECURITY.md](./SECURITY.md)

## Repositorio

- **GitHub:** https://github.com/Francesc007/Concretos-Narvaez
- Rama principal: `main`

## Licencia

Proyecto privado — uso exclusivo de Concretos Narváez y colaboradores autorizados.
