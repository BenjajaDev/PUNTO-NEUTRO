---
name: puntoneutro-frontend
description: Guía de desarrollo de Punto Neutro — monorepo pnpm con sitio + panel en React 19 + Vite + TypeScript (web/), API Express 5 + Prisma 7 + PostgreSQL (server/) y despliegue en Cloudflare Pages + Render. Úsala SIEMPRE que escribas, refactorices o depures código del proyecto — páginas, rutas, componentes, panel de administración, endpoints, esquema de Prisma, migraciones, seed, autenticación y roles, medios, buzón, dependencias, tests o despliegue — aunque el pedido no diga "frontend" (ej. "agrega una sección", "nuevo campo en las entrevistas", "el buzón no guarda", "agrega un rol", "instala X", "sube a producción"). Para look & feel y animaciones, combínala con puntoneutro-ui; para consultas de Prisma, con prisma-client-api.
---

# Punto Neutro — desarrollo

Fuente de la verdad del producto: la «Propuesta de Arquitectura y Diseño Web: Punto Neutro» (proyecto de título de Periodismo, U. Autónoma de Chile). Secciones: Inicio, Nosotras, Anatomía de un Trend, Pequeñas Entrevistas, Glosario, **Querer encajar** (salud mental, prejuicios y manejo emocional; modelo `Reflection`), Buzón Comunitario, Podcast «A Pausar el Filtro», Cierre y footer. Requerimientos vigentes (RF-01…04, RNF-01/02): ver «Reglas de la API» y `docs/estrategia-difusion-audiovisual.md`.

## Estructura

| Pieza | Dónde | Tecnología |
|---|---|---|
| Sitio público | `web/src/site` | React 19, React Router 7 (data router), CSS con tokens |
| Panel admin | `web/src/admin` (carga diferida en `/admin`) | mismos componentes `@/ui` |
| API | `server/src` | Express 5, zod 4, jose (JWT en cookie httpOnly) |
| Datos | `server/prisma/schema.prisma` | Prisma 7 (`prisma-client` + `@prisma/adapter-pg`), cliente en `server/src/generated/prisma`; en producción, PostgreSQL en Supabase |
| Proxy de producción | `web/functions/api/[[path]].ts` | Cloudflare Pages Function → API en Render |

## Reglas de la API

- Rutas públicas en `routes/public.ts`: **solo leen contenido publicado** (`status: 'PUBLISHED'` / `published: true`). Lo único público que escribe es `POST /api/mailbox`.
- Panel en `routes/admin/` bajo `requireCsrfHeader` + `requireAuth`. Solo administración: configuración (PUT), usuarios, historial, borrar relatos. CRUD estándar ⇒ `crudRouter({ entity, delegate, schema, orderBy, describe, prepare })`.
- Validación SIEMPRE con zod en `schemas.ts` y `parse()` (errores por campo en español). Mensajes de error para personas, en español.
- Todo cambio del panel queda en `audit()`.
- Buzón: anonimato estricto (si `anonymous`, alias y correo se descartan), sin IP, consentimiento obligatorio, publicar solo `publicExcerpt` revisado y solo si `allowPublication`.
  - RF-01: `topic` es un enum (`TOPICS` en `schemas.ts`, espejo en `web/src/lib/types.ts`); con «Otros» `topicOther` es obligatorio y nunca se publica.
  - RF-02: `acceptRules` obligatorio (normas en `SiteSettings.communityRules`). `lib/moderation.ts` **marca** (`flagged`, `flagReasons`, `flagMatches`) pero nunca rechaza: un testimonio puede citar insultos. El equipo etiqueta con `MODERATION_LABELS` y descarta (`REJECTED`).
- RF-04: una nota de Anatomía de un Trend solo se publica con autora (`authorMemberId` → `TeamMember`, perfil visible) y ≥ 1 referencia (`references: [{ citation, url }]`). Los artículos de Querer encajar exigen referencias; la autora es opcional. Lo valida `publishRules` en `schemas.ts`.
- Identidad editable: `/api/favicon` (index.html apunta ahí; sin favicon propio redirige a `/favicon.svg`), `siteTitle` + `usePageTitle()` en cada página, portadas por sección (`*CoverId`) y `heroImageId`.
- Entrevistas: `category` (enum `InterviewCategory`: `EXPERTAS`, `INFLUENCERS`, `MUJERES`) es obligatoria, sin valor por defecto. `GET /api/interviews?category=` filtra; en el sitio la pestaña vive en `?categoria=<slug>` (`INTERVIEW_CATEGORIES` en `web/src/lib/types.ts` tiene key, slug, etiqueta y descripción).
- Entrevistas: `questions Json` = `[{ question, answer }]` (≤ 20, sin cantidad fija). Borrador con respuestas vacías; publicar exige ≥ 1 y todas respondidas (`interviewSchema.superRefine`). Las listas públicas y `/api/home` devuelven `InterviewSummary` (`firstQuestion`, `questionCount`), no las respuestas.
- Podcast: tarjeta = `title`, `summary`, `tags` (≤ 8, deduplicadas por `tagKey`), `coverId` (→ `Media`) y `soundcloudUrl`. El enlace pasa por `normalizeSoundcloudUrl` (`server/src/lib/soundcloud.ts`: solo soundcloud.com / m. / www. / on.soundcloud.com, sin query ni hash). `server/src/lib/{soundcloud,tags}.ts` son TS puro y el panel los reexporta desde `web/src/lib/soundcloud.ts`: **una sola implementación de la validación** para API y navegador. `GET /api/podcast?tag=` filtra. Arquitectura completa en `docs/arquitectura-entrevistas-podcast.md`.
- Medios: imágenes en Postgres (`Media.data`), sin SVG, máx. 5 MB, servidas con caché inmutable en `/api/media/:id`.

## Reglas del cliente

- Llamadas solo con `api()` de `lib/api.ts` (agrega `X-Requested-With`, convierte errores en `ApiError`).
- Datos asíncronos con `useResource(loader, deps)` (aborta al desmontar) y estados loading/error/vacío explícitos.
- Tipos de respuesta en `lib/types.ts` (espejo del schema). Si cambias el schema, actualiza los tipos.
- Componentes reutilizables: `Tabs` + `tabPanelProps` (`@/ui`, patrón WAI-ARIA con flechas/Inicio/Fin), `PodcastCard` (`site/components`, también es la vista previa del panel con `preview`), `InterviewCategoryPicker` (radios como tarjetas), `InterviewQuestionsField` (preguntas dinámicas; sin preguntas sugeridas, por decisión del equipo). `CrudDialogPage` acepta `validate` por campo y `preview` del ítem en edición.
- Filtros de páginas públicas en la URL (`useSearchParams` + `preventScrollReset`), para que se puedan compartir y el botón «atrás» funcione.
- Rutas en `App.tsx` (sitio) y `admin/AdminApp.tsx` (panel). Enlaces internos con `viewTransition`.

## Recetas

- **Modelo nuevo (tabla)**: además de lo anterior, su migración debe terminar con `ALTER TABLE "<Tabla>" ENABLE ROW LEVEL SECURITY;` (Supabase expone `public` por la Data API; lo exige `tests/db.test.ts`) y la tabla se agrega a `TABLES` en `prisma/copy-data.ts` en orden de claves foráneas.
- **Campo nuevo en un contenido**: `schema.prisma` → migración (ver «Migraciones» abajo) → `schemas.ts` → `lib/types.ts` → editor del panel (y `EDITABLE` si usa `useEntityEditor`) → página pública → test en `server/tests`.
- **Sección nueva del sitio**: modelo + migración → rutas públicas y `crudRouter` en admin → página en `site/pages` (con `PageHero`, skeleton, vacío) → enlace en `NAV` de `SiteLayout` → página del panel (`CrudDialogPage` si es simple) → entrada en `SECTIONS` de `AdminLayout`.
- **Texto institucional editable**: campo en `SiteSettings` + `settingsSchema` + `SettingsAdmin` (`SECTIONS`) + tipo `SiteSettings`.
- **Rol o permiso**: enum `Role` + `requireRole(...)` + `adminOnly` en `AdminApp` + `adminOnly` en el menú.

## Convenciones

- Código en inglés; textos de UI y comentarios en español de Chile. Los comentarios explican el **por qué**.
- Nunca secretos en el cliente; variables del servidor en `server/.env` (ver `.env.example`).
- Dependencias con `pnpm add --filter <web|server> <pkg>` y versión fijada con `^`.
- Migraciones: nunca editar una ya aplicada; nunca `migrate reset` sobre bases con datos.
  - **`prisma migrate dev` no funciona** con la base sombra: `20261017120000_enable_rls` altera `_prisma_migrations`, que no existe ahí. Genera el SQL sin base sombra y aplícalo con deploy:
    ```bash
    git show HEAD:server/prisma/schema.prisma > /tmp/old.prisma
    mkdir prisma/migrations/<AAAAMMDDHHMMSS>_<nombre>
    pnpm prisma migrate diff --from-schema /tmp/old.prisma --to-schema prisma/schema.prisma --script -o prisma/migrations/<…>/migration.sql
    pnpm prisma migrate deploy && pnpm prisma generate
    ```
  - Contenido que debe llegar a bases ya inicializadas (producción) va en la migración como `UPDATE … WHERE campo = ''` / `INSERT … ON CONFLICT DO NOTHING` (nunca pisa ediciones). Las bases nuevas lo reciben igual; si el seed crea esas filas, refleja el contenido en `prisma/seed-content.ts`. Si la migración inserta filas, agrega la tabla a `MIGRATION_CONTENT` en `prisma/copy-data.ts`.
- Conexión: la API usa `DATABASE_URL` (pooler en modo transacción de Supabase) vía `pgConfig()`; las migraciones usan `DIRECT_URL` (modo sesión) si existe. No usar sentencias preparadas con nombre ni `SET` de sesión en la API: el pooler en modo transacción no las conserva.

## Verificación antes de entregar (obligatoria)

1. `pnpm typecheck` (web + server).
2. `pnpm test` — server usa `TEST_DATABASE_URL` (base separada, `migrate deploy` + limpieza por test); web corre contraste WCAG y componentes.
3. `pnpm build`.
4. Cambios visuales: revisar en navegador claro/oscuro y 375 px (Playwright con `reducedMotion: 'reduce'` para capturas de página completa).
5. Relee el diff: endpoints sin zod, rutas públicas que filtren borradores, acciones críticas sin `confirm`, hex sueltos.

## Despliegue

Ver `DESPLIEGUE.md`: web en Cloudflare Pages (root `web`, Function proxy, `_headers`), API en Render (`render.yaml`, `TRUST_PROXY=2`, `PROXY_SECRET` compartido) y PostgreSQL en Supabase (`SUPABASE.md`: `DATABASE_URL`, `DIRECT_URL`, `DATABASE_SSL_CA`, RLS, `db:copy`).
