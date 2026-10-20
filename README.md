# Punto Neutro

Sitio periodístico transmedia sobre **neutralidad corporal**, con perspectiva de género. Proyecto de Título de Periodismo — Universidad Autónoma de Chile (Anabel Duarte Leiva y Constanza Torres Muñoz).

- **Sitio público** (React 19 + Vite): Inicio · Nosotras · Anatomía de un Trend (con autora y referencias) · Pequeñas Entrevistas · Glosario interactivo · Querer encajar (salud mental y prejuicios) · Buzón Comunitario (normas de convivencia y filtro de moderación) · Podcast «A Pausar el Filtro» · Cierre y footer. Portadas, favicon y título de la página editables desde el panel. Tema claro/oscuro, animaciones sutiles, accesible (WCAG 2.1 AA).
- **Panel de administración** (`/admin`): todas las secciones editables, moderación del buzón con filtro editorial, biblioteca de medios, configuración del sitio (logo, textos, contacto, redes, legal), usuarios con roles (*Administración* / *Editora*) e historial de cambios.
- **API** (Express 5) con **PostgreSQL vía Prisma 7**. Las imágenes también se guardan en la base.

## Requisitos

- Node **22.18+** (ver `.node-version`) y pnpm 10 (`npm i -g pnpm` o `corepack enable`)
- PostgreSQL 16 (local o `docker compose up -d`)

## Puesta en marcha

```bash
pnpm install
cp server/.env.example server/.env      # ajusta DATABASE_URL si hace falta
docker compose up -d                     # (opcional) Postgres local
pnpm db:migrate                          # crea las tablas
pnpm db:seed                             # contenido de la propuesta + cuenta admin
pnpm dev                                 # API :4000 + sitio :5173
```

- Sitio: <http://localhost:5173>
- Panel: <http://localhost:5173/admin> — `admin@puntoneutro.cl` / `PuntoNeutro2026!` (cámbiala en *Mi cuenta*).

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | API y sitio en modo desarrollo |
| `pnpm typecheck` | TypeScript en web y server |
| `pnpm test` | Tests de la API (Postgres real, base `TEST_DATABASE_URL`) y del sitio (contraste WCAG, componentes) |
| `pnpm build` | Compila server y web |
| `pnpm db:migrate` / `pnpm db:seed` | Migraciones y contenido inicial |
| `pnpm --filter server db:copy` | Copia todos los datos de una base a otra vacía (ej. Render → Supabase) |
| `pnpm --filter server db:studio` | Explorar la base con Prisma Studio |

## Estructura

```
web/      sitio + panel (src/site, src/admin, src/ui, src/theme/tokens.ts)
          functions/api/[[path]].ts → proxy de Cloudflare Pages hacia la API
server/   API Express (src/routes), Prisma (prisma/schema.prisma, migrations, seed.ts), tests
.claude/  skills del proyecto: puntoneutro-frontend, puntoneutro-ui y skills oficiales de Prisma
```

## Despliegue

Cloudflare Pages (sitio) + Render (API) + Supabase (PostgreSQL). Paso a paso en **[DESPLIEGUE.md](DESPLIEGUE.md)** y **[SUPABASE.md](SUPABASE.md)**.
- Estrategia de cápsulas para redes (RNF-02): [docs/estrategia-difusion-audiovisual.md](docs/estrategia-difusion-audiovisual.md).
- **Manual de uso del panel** (para el equipo editorial, sin lenguaje técnico): [docs/manual-de-uso.pdf](docs/manual-de-uso.pdf).
- Arquitectura de entrevistas por categoría y tarjetas de podcast (esquema, API, componentes y lógica): [docs/arquitectura-entrevistas-podcast.md](docs/arquitectura-entrevistas-podcast.md).
