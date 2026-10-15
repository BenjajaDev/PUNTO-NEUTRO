# Despliegue de Punto Neutro

El proyecto tiene dos piezas y cada una va en un servicio distinto:

| Pieza | Qué es | Dónde se despliega |
|---|---|---|
| `web/` | Sitio público y panel (React + Vite, estático) | **Cloudflare Pages** (ya conectado al repo) |
| `server/` | API (Express + Prisma) y base de datos PostgreSQL | **Render** (o cualquier hosting Node con Postgres) |

> **¿Por qué no todo en Cloudflare Pages?** Pages sirve archivos estáticos y *Functions* que corren en el runtime de Workers. No puede ejecutar un servidor Express ni alojar PostgreSQL. Por eso la API vive aparte, y Pages le reenvía todo lo que empieza con `/api/` mediante una Function (`web/functions/api/[[path]].ts`).

```
Navegador ──► puntoneutro.pages.dev ──┬─► archivos estáticos (web/dist)
                (Cloudflare Pages)    └─► /api/* ──► Function proxy ──► API en Render ──► PostgreSQL
```

Gracias al proxy, el navegador habla con un solo dominio: la cookie de sesión del panel sigue siendo propia y no hace falta configurar CORS.

Haz los pasos **en este orden**: primero la API (paso 1), porque Cloudflare necesita su URL.

---

## 1. API + base de datos en Render

### 1.1 Crear los servicios con el blueprint

1. Entra a <https://dashboard.render.com> e inicia sesión con GitHub.
2. **New → Blueprint** y elige el repositorio `BenjajaDev/PUNTO-NEUTRO` (rama `main`, o la que vayas a publicar).
3. Render lee `render.yaml` y propone crear:
   - `punto-neutro-api` (servicio web Node)
   - `punto-neutro-db` (PostgreSQL)
4. Te pedirá los valores marcados como secretos. Complétalos:

| Variable | Valor |
|---|---|
| `PROXY_SECRET` | Un texto largo y aleatorio (ver abajo cómo generarlo). **Guárdalo**: lo vas a repetir en Cloudflare. |
| `SEED_ADMIN_EMAIL` | El correo de la primera cuenta administradora, ej. `admin@puntoneutro.cl` |
| `SEED_ADMIN_PASSWORD` | Su contraseña inicial (mínimo 10 caracteres). Cámbiala después desde **Panel → Mi cuenta**. |

Para generar `PROXY_SECRET`, en una terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`JWT_SECRET` lo genera Render automáticamente; `DATABASE_URL` se conecta sola a la base creada.

5. **Apply**. El primer build tarda unos minutos. El comando de build:
   - instala dependencias,
   - compila la API,
   - aplica las migraciones (`prisma migrate deploy`),
   - carga el contenido inicial de la propuesta (solo la primera vez, con la base vacía) y crea la cuenta administradora.

### 1.2 Verificar

Copia la URL pública del servicio (algo como `https://punto-neutro-api.onrender.com`) y abre:

```
https://punto-neutro-api.onrender.com/api/health   →  {"ok":true}
https://punto-neutro-api.onrender.com/api/site     →  {"error":"Acceso directo no permitido."}
```

Que `/api/site` responda *Acceso directo no permitido* es correcto: con `PROXY_SECRET` definido, la API solo atiende lo que llega a través de Cloudflare.

### Notas del plan gratuito de Render

- El servicio web **se duerme tras ~15 minutos sin visitas**; la primera visita después tarda unos 30–60 s en responder. Para evitarlo, usa un plan pagado.
- La base PostgreSQL gratuita de Render **expira a los 30 días**. Para un proyecto que debe durar, usa una base gratuita persistente de **Neon** (ver sección 4) o un plan pagado de Render.

---

## 2. Sitio en Cloudflare Pages

En <https://dash.cloudflare.com> → **Workers & Pages** → tu proyecto conectado a `PUNTO-NEUTRO` → **Settings**.

### 2.1 Configuración de build (Settings → Build)

| Campo | Valor |
|---|---|
| **Framework preset** | `None` |
| **Production branch** | `main` (o la rama que publiques) |
| **Root directory** | `web` |
| **Build command** | `cd .. && npx pnpm@10.28.0 install --frozen-lockfile --filter web && cd web && npx pnpm@10.28.0 run build` |
| **Build output directory** | `dist` |

El *Root directory* debe ser `web` porque ahí está la carpeta `functions/` que Pages usa para el proxy. El comando sube un nivel para instalar con el `pnpm-lock.yaml` del monorepo (versiones exactas).

### 2.2 Variables (Settings → Variables and Secrets)

Agrégalas para **Production** (y también para **Preview** si usarás despliegues de prueba):

| Nombre | Tipo | Valor |
|---|---|---|
| `API_ORIGIN` | Text | La URL de Render, **sin barra final**, ej. `https://punto-neutro-api.onrender.com` |
| `PROXY_SECRET` | Secret | El mismo valor que pusiste en Render |
| `SKIP_DEPENDENCY_INSTALL` | Text | `true` (la instalación la hace el build command) |
| `NODE_VERSION` | Text | `22.22.0` |

> El sitio necesita Node 22.18 o superior para el build (el script de tokens de color se ejecuta como TypeScript). El archivo `web/.node-version` ya lo fija; `NODE_VERSION` es un respaldo.

### 2.3 Desplegar

**Deployments → Retry deployment** (o haz un push a la rama de producción). Al terminar:

1. Abre `https://<tu-proyecto>.pages.dev` → debe cargar la portada con el contenido de la propuesta.
2. Abre `https://<tu-proyecto>.pages.dev/api/health` → `{"ok":true}` (confirma que el proxy llega a la API).
3. Entra a `https://<tu-proyecto>.pages.dev/admin` con `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

Las cabeceras de seguridad del sitio (CSP, anti-iframe, caché de `/assets`) ya vienen en `web/public/_headers`. Las rutas como `/glosario` funcionan al recargar porque Pages trata el proyecto como SPA (no hay `404.html`).

---

## 3. Primeros pasos después de publicar

1. **Panel → Mi cuenta**: cambia la contraseña inicial.
2. **Panel → Configuración del sitio**: completa correo, teléfono/WhatsApp, Instagram, Facebook, perfil de SoundCloud y sube el logo. El **Resumen** del panel lista lo que falta.
3. **Panel → Usuarios y roles**: crea las cuentas del equipo (rol *Editora* para contenidos y buzón; *Administración* para todo).
4. Reemplaza la **entrevista** y el **episodio** de ejemplo (están como borrador) y publícalos.
5. Revisa y ajusta las tres notas de **Anatomía de un Trend** de ejemplo.

---

## 4. (Recomendado) Base de datos persistente en Neon

1. Crea una cuenta en <https://neon.tech> y un proyecto (región cercana a la de Render, ej. *US West*).
2. Copia la *connection string* con `?sslmode=require`.
3. En Render → `punto-neutro-api` → **Environment** → reemplaza `DATABASE_URL` por la de Neon → **Save, rebuild and deploy**. Las migraciones y el contenido inicial se aplican solos en ese build.
4. Si ya tenías datos en la base de Render, expórtalos antes con `pg_dump` e impórtalos en Neon con `psql`.
5. Puedes borrar `punto-neutro-db` en Render cuando confirmes que todo funciona.

---

## 5. Dominio propio (opcional)

- **Sitio**: Cloudflare Pages → **Custom domains** → agrega `puntoneutro.cl` (o el que tengan). Si el dominio está en Cloudflare, el DNS se configura solo.
- La API **no necesita dominio propio**: el navegador nunca la llama directo, siempre pasa por `/api` del sitio.

---

## 6. Actualizaciones

- Cada push a la rama de producción vuelve a desplegar **ambos** servicios (Pages y Render tienen auto-deploy).
- Si cambias `server/prisma/schema.prisma`, crea la migración en local (`pnpm db:migrate`) y súbela junto con el cambio: Render la aplica en el build con `prisma migrate deploy`.
- El contenido inicial **no** se vuelve a cargar en despliegues siguientes, aunque se borre contenido desde el panel. Para rellenar solo lo vacío de forma intencional, despliega una vez con `SEED_FORCE=1`.

---

## 7. Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| El sitio carga pero dice *No pudimos cargar esta sección* | Pages no llega a la API: revisa `API_ORIGIN` (sin barra final) y que `/api/health` responda en Render. |
| `/api/...` responde *Falta configurar API_ORIGIN* | La variable no está en el entorno correcto (Production/Preview) o falta un nuevo despliegue tras agregarla. |
| `/api/...` responde *Acceso directo no permitido* a través de Pages | `PROXY_SECRET` no coincide entre Cloudflare y Render. |
| La primera visita tarda casi un minuto | Render gratis estaba dormido. Es normal en ese plan. |
| No se puede iniciar sesión en el panel (vuelve al login) | La API debe tener `NODE_ENV=production` y el sitio servirse por **https** (la cookie es `Secure`). |
| El build de Pages falla en `syncTokens.ts` | Node menor a 22.18: revisa `NODE_VERSION=22.22.0`. |
| El build de Render falla con `prisma: not found` | Falta `--prod=false` en el build command (está en `render.yaml`). |
| El buzón responde *Recibimos varios relatos desde tu conexión* para todos | `TRUST_PROXY` debe ser `2` en Render (Cloudflare + balanceador de Render). |

---

## Alternativa: todo en un solo servidor

Si prefieren no usar Cloudflare Pages, la API también sirve el sitio compilado. En cualquier hosting Node:

```bash
pnpm install --frozen-lockfile --prod=false
pnpm build                       # compila server/ y web/
pnpm --filter server db:deploy   # migraciones
pnpm --filter server db:seed     # contenido inicial (solo base vacía)
NODE_ENV=production pnpm start   # sirve el sitio y la API en el mismo puerto
```

En ese caso no definas `PROXY_SECRET` y usa `TRUST_PROXY=1`.
