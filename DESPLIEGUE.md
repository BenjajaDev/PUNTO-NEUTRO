# Despliegue de Punto Neutro

El proyecto tiene tres piezas y cada una va en un servicio distinto:

| Pieza | Qué es | Dónde se despliega |
|---|---|---|
| `web/` | Sitio público y panel (React + Vite, estático) | **Cloudflare Pages** (ya conectado al repo) |
| `server/` | API (Express + Prisma) | **Render** (o cualquier hosting Node) |
| Base de datos | PostgreSQL | **Supabase** (ver **[SUPABASE.md](SUPABASE.md)**) |

> **¿Por qué no todo en Cloudflare Pages?** Pages sirve archivos estáticos y *Functions* que corren en el runtime de Workers. No puede ejecutar un servidor Express ni alojar PostgreSQL. Por eso la API vive aparte, y Pages le reenvía todo lo que empieza con `/api/` mediante una Function (`web/functions/api/[[path]].ts`).

```
Navegador ──► puntoneutro.pages.dev ──┬─► archivos estáticos (web/dist)
                (Cloudflare Pages)    └─► /api/* ──► Function proxy ──► API en Render ──► Supabase (PostgreSQL)
```

Gracias al proxy, el navegador habla con un solo dominio: la cookie de sesión del panel sigue siendo propia y no hace falta configurar CORS.

Haz los pasos **en este orden**: primero la base en Supabase (pasos 1 a 4 de [SUPABASE.md](SUPABASE.md)), luego la API (paso 1), porque Cloudflare necesita su URL.

---

## 1. API en Render

### 1.1 Crear los servicios con el blueprint

1. Entra a <https://dashboard.render.com> e inicia sesión con GitHub.
2. **New → Blueprint** y elige el repositorio `BenjajaDev/PUNTO-NEUTRO` (rama `main`, o la que vayas a publicar).
3. Render lee `render.yaml` y propone crear `punto-neutro-api` (servicio web Node). La base no se crea en Render: vive en Supabase.
4. Te pedirá los valores marcados como secretos. Complétalos:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL del **Transaction pooler** de Supabase (puerto `6543`). Ver [SUPABASE.md](SUPABASE.md), paso 2. |
| `DIRECT_URL` | URL del **Session pooler** de Supabase (puerto `5432`). |
| `DATABASE_SSL_CA` | Contenido completo del certificado de Supabase (`prod-ca-2021.crt`). Ver [SUPABASE.md](SUPABASE.md), paso 3. |
| `PROXY_SECRET` | Un texto largo y aleatorio (ver abajo cómo generarlo). **Guárdalo**: lo vas a repetir en Cloudflare. |
| `SEED_ADMIN_EMAIL` | El correo de la primera cuenta administradora, ej. `admin@puntoneutro.cl` |
| `SEED_ADMIN_PASSWORD` | Su contraseña inicial (mínimo 10 caracteres). Cámbiala después desde **Panel → Mi cuenta**. |

Para generar `PROXY_SECRET`, en una terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`JWT_SECRET` lo genera Render automáticamente.

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
- La base de datos no depende de Render: está en Supabase, que no expira (el plan gratuito sí se pausa tras 7 días sin actividad; ver [SUPABASE.md](SUPABASE.md)).

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

## 4. Base de datos en Supabase

Creación del proyecto, URLs de conexión, certificado, copia de los datos que ya existan (desde Render o local) y verificación: todo en **[SUPABASE.md](SUPABASE.md)**.

Cualquier otro PostgreSQL gestionado (Neon, Render, etc.) también sirve: basta con `DATABASE_URL` (y `DIRECT_URL` si la API usa un *pooler* en modo transacción).

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
| El build de Render falla al conectar con la base | Revisa `DATABASE_URL`, `DIRECT_URL` y `DATABASE_SSL_CA`. Errores típicos de Supabase en [SUPABASE.md](SUPABASE.md#solución-de-problemas). |

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
