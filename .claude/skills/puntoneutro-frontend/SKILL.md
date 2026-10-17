---
name: puntoneutro-frontend
description: Guía de desarrollo de Punto Neutro — monorepo pnpm con sitio + panel en React 19 + Vite + TypeScript (web/), API Express 5 + Prisma 7 + PostgreSQL (server/) y despliegue en Cloudflare Pages + Render. Úsala SIEMPRE que escribas, refactorices o depures código del proyecto — páginas, rutas, componentes, panel de administración, endpoints, esquema de Prisma, migraciones, seed, autenticación y roles, medios, buzón, dependencias, tests o despliegue — aunque el pedido no diga "frontend" (ej. "agrega una sección", "nuevo campo en las entrevistas", "el buzón no guarda", "agrega un rol", "instala X", "sube a producción"). Para look & feel y animaciones, combínala con puntoneutro-ui; para consultas de Prisma, con prisma-client-api.
---

# Punto Neutro — desarrollo

Fuente de la verdad del producto: la «Propuesta de Arquitectura y Diseño Web: Punto Neutro» (proyecto de título de Periodismo, U. Autónoma de Chile). Secciones: Inicio, Nosotras, Anatomía de un Trend, Pequeñas Entrevistas, Glosario, Buzón Comunitario, Podcast «A Pausar el Filtro», Cierre y footer.

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
- Medios: imágenes en Postgres (`Media.data`), sin SVG, máx. 5 MB, servidas con caché inmutable en `/api/media/:id`.

## Reglas del cliente

- Llamadas solo con `api()` de `lib/api.ts` (agrega `X-Requested-With`, convierte errores en `ApiError`).
- Datos asíncronos con `useResource(loader, deps)` (aborta al desmontar) y estados loading/error/vacío explícitos.
- Tipos de respuesta en `lib/types.ts` (espejo del schema). Si cambias el schema, actualiza los tipos.
- Rutas en `App.tsx` (sitio) y `admin/AdminApp.tsx` (panel). Enlaces internos con `viewTransition`.

## Recetas

- **Modelo nuevo (tabla)**: además de lo anterior, su migración debe terminar con `ALTER TABLE "<Tabla>" ENABLE ROW LEVEL SECURITY;` (Supabase expone `public` por la Data API; lo exige `tests/db.test.ts`) y la tabla se agrega a `TABLES` en `prisma/copy-data.ts` en orden de claves foráneas.
- **Campo nuevo en un contenido**: `schema.prisma` → `pnpm db:migrate` (nombre descriptivo) → `schemas.ts` → `lib/types.ts` → editor del panel (y `EDITABLE` si usa `useEntityEditor`) → página pública → test en `server/tests`.
- **Sección nueva del sitio**: modelo + migración → rutas públicas y `crudRouter` en admin → página en `site/pages` (con `PageHero`, skeleton, vacío) → enlace en `NAV` de `SiteLayout` → página del panel (`CrudDialogPage` si es simple) → entrada en `SECTIONS` de `AdminLayout`.
- **Texto institucional editable**: campo en `SiteSettings` + `settingsSchema` + `SettingsAdmin` (`SECTIONS`) + tipo `SiteSettings`.
- **Rol o permiso**: enum `Role` + `requireRole(...)` + `adminOnly` en `AdminApp` + `adminOnly` en el menú.

## Convenciones

- Código en inglés; textos de UI y comentarios en español de Chile. Los comentarios explican el **por qué**.
- Nunca secretos en el cliente; variables del servidor en `server/.env` (ver `.env.example`).
- Dependencias con `pnpm add --filter <web|server> <pkg>` y versión fijada con `^`.
- Migraciones: nunca editar una ya aplicada; nunca `migrate reset` sobre bases con datos.
- Conexión: la API usa `DATABASE_URL` (pooler en modo transacción de Supabase) vía `pgConfig()`; las migraciones usan `DIRECT_URL` (modo sesión) si existe. No usar sentencias preparadas con nombre ni `SET` de sesión en la API: el pooler en modo transacción no las conserva.

## Verificación antes de entregar (obligatoria)

1. `pnpm typecheck` (web + server).
2. `pnpm test` — server usa `TEST_DATABASE_URL` (base separada, `migrate deploy` + limpieza por test); web corre contraste WCAG y componentes.
3. `pnpm build`.
4. Cambios visuales: revisar en navegador claro/oscuro y 375 px (Playwright con `reducedMotion: 'reduce'` para capturas de página completa).
5. Relee el diff: endpoints sin zod, rutas públicas que filtren borradores, acciones críticas sin `confirm`, hex sueltos.

## Despliegue

Ver `DESPLIEGUE.md`: web en Cloudflare Pages (root `web`, Function proxy, `_headers`), API en Render (`render.yaml`, `TRUST_PROXY=2`, `PROXY_SECRET` compartido) y PostgreSQL en Supabase (`SUPABASE.md`: `DATABASE_URL`, `DIRECT_URL`, `DATABASE_SSL_CA`, RLS, `db:copy`).
