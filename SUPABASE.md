# Base de datos en Supabase

Supabase es PostgreSQL gestionado, así que Punto Neutro funciona ahí sin cambiar el esquema: Prisma crea las mismas tablas y la API sigue igual. Lo que el proyecto ya trae preparado:

| Qué | Por qué |
|---|---|
| `DATABASE_URL` + `DIRECT_URL` | La API usa el *pooler* en modo transacción (puerto **6543**); las migraciones necesitan una sesión estable y van por el modo sesión (puerto **5432**). Ver `server/prisma.config.ts`. |
| `DATABASE_SSL_CA` | Supabase firma su certificado con una CA propia. Con ella la API verifica que habla con Supabase (`server/src/lib/pgConfig.ts`). |
| RLS en todas las tablas | Supabase publica el esquema `public` por su Data API con una llave pública (`anon`). La migración `20261017120000_enable_rls` activa Row Level Security y quita permisos a `anon`/`authenticated`: nadie puede leer usuarios ni relatos del buzón por esa vía. Prisma no se ve afectado porque es dueña de las tablas. |
| `pnpm --filter server db:copy` | Copia todos los datos (incluidas las imágenes) desde la base actual a Supabase, sin necesitar `pg_dump`. |

La arquitectura queda así:

```
Navegador ─► Cloudflare Pages ─► /api/* ─► API en Render ─► Supabase (PostgreSQL)
```

> Los comandos de esta guía son para **PowerShell** en Windows, desde la carpeta `server/` del repositorio.

---

## 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com/dashboard> → **New project**.
2. **Name**: `punto-neutro`.
3. **Database password**: genera una y **guárdala**. Si vas a escribirla a mano en una URL, evita `@ : / ? # %` (o codifícalos, ej. `@` → `%40`).
4. **Region**: la más cercana a la API. Con Render en *Oregon* (`render.yaml`), elige **West US (North California)**. La API hace varias consultas por página: que estén cerca importa más que la cercanía con quien visita el sitio.
5. **Create new project** y espera a que termine (1–2 minutos).

## 2. Copiar las dos URLs de conexión

En el proyecto, botón **Connect** (barra superior) → pestaña **Connection string**:

| Método en Supabase | Puerto | Variable |
|---|---|---|
| **Transaction pooler** | `6543` | `DATABASE_URL` |
| **Session pooler** | `5432` | `DIRECT_URL` |

Ambas se ven así (cambia `[YOUR-PASSWORD]` por la clave del paso 1):

```
postgresql://postgres.<ref>:<clave>@aws-0-us-west-1.pooler.supabase.com:6543/postgres
postgresql://postgres.<ref>:<clave>@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

> **No uses la «Direct connection»** (`db.<ref>.supabase.co`): solo funciona por IPv6 y Render no llega a ella. Los dos *poolers* funcionan por IPv4.

## 3. Descargar el certificado SSL

**Project Settings → Database → SSL Configuration → Download certificate**. Se descarga `prod-ca-2021.crt` (un texto que empieza con `-----BEGIN CERTIFICATE-----`). Su contenido es el valor de `DATABASE_SSL_CA`.

Guárdalo fuera del repositorio (ej. en `Descargas`); no hace falta subirlo.

## 4. Crear las tablas en Supabase

Desde `server/`:

```powershell
$env:DIRECT_URL   = "postgresql://postgres.<ref>:<clave>@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
$env:DATABASE_URL = $env:DIRECT_URL
pnpm db:deploy
```

Debe terminar con *All migrations have been successfully applied*. En Supabase → **Table Editor** verás las tablas (`User`, `Trend`, `MailboxSubmission`…) con el candado de RLS activo.

> Las variables `$env:` duran solo mientras esté abierta esa ventana de PowerShell. Si la cierras, vuelve a definirlas.

## 5. Datos: elige un camino

### Camino A — Empezar de cero (no hay contenido que conservar)

No hagas nada aquí: en el paso 6, el build de Render carga el contenido inicial de la propuesta y crea la cuenta administradora.

### Camino B — Traer los datos actuales (Render o local)

Usa este camino si el equipo ya cargó contenido, fotos o recibió relatos en el buzón.

1. **Consigue la URL de la base actual.**
   - En Render: **Dashboard → punto-neutro-db → Connections → External Database URL**. Agrégale `?sslmode=require` al final.
   - Si los datos están en tu Postgres local: `postgresql://puntoneutro:puntoneutro@localhost:5432/puntoneutro`.

2. **Deja ambas bases con las mismas migraciones.** La base actual todavía no tiene la migración de RLS (no cambia datos, solo permisos):

   ```powershell
   $env:SOURCE_DATABASE_URL = "<URL de la base actual>"
   $env:DIRECT_URL   = $env:SOURCE_DATABASE_URL
   $env:DATABASE_URL = $env:SOURCE_DATABASE_URL
   pnpm db:deploy
   ```

3. **Copia los datos.** Hazlo en un momento tranquilo: un relato que llegue al buzón después de copiar y antes del paso 6 quedaría solo en la base antigua.

   ```powershell
   $env:TARGET_DATABASE_URL    = "<DIRECT_URL de Supabase, puerto 5432>"
   $env:TARGET_DATABASE_SSL_CA = Get-Content -Raw "$HOME\Downloads\prod-ca-2021.crt"
   pnpm db:copy
   ```

   Resultado esperado:

   ```
     User               3
     Media              12
     SiteSettings       1
     ...
   Listo: datos copiados y verificados.
   ```

   El script solo **lee** la base actual. En Supabase escribe todo en una transacción: si algo falla, no queda nada a medias. Se niega a copiar si las migraciones no coinciden o si Supabase ya tiene datos.

## 6. Conectar la API de Render a Supabase

Render → servicio **punto-neutro-api** → **Environment**. Define (o reemplaza):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL del **Transaction pooler** (puerto `6543`) |
| `DIRECT_URL` | URL del **Session pooler** (puerto `5432`) |
| `DATABASE_SSL_CA` | Abre `prod-ca-2021.crt` con el Bloc de notas y pega **todo** el contenido, incluidas las líneas `BEGIN`/`END` |

Luego **Save, rebuild and deploy**. En el build:

- `db:deploy` no hace nada (las tablas ya existen) o las crea (camino A, si te saltaste el paso 4).
- `db:seed` carga el contenido inicial **solo si la base está vacía**. Con el camino B se lo salta.

> Si Render tenía `DATABASE_URL` enlazada a `punto-neutro-db` (blueprint antiguo), al editarla queda como valor manual. El `render.yaml` del repositorio ya no crea esa base.

## 7. Verificar

1. `https://<tu-proyecto>.pages.dev/api/health` → `{"ok":true}`.
2. La portada carga con su contenido y las imágenes se ven.
3. Entra a `/admin`: con el camino B, con las mismas cuentas de antes; con el A, con `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
4. Envía un relato de prueba en el Buzón y revisa que aparezca en **Panel → Buzón**. Luego bórralo.
5. Supabase → **Advisors → Security Advisor**: no deben aparecer errores de *RLS disabled*. El aviso informativo *RLS enabled, no policy* es lo esperado: significa que la Data API no ve ninguna fila.

## 8. Después de migrar (recomendado)

- **Desactiva la Data API**, que Punto Neutro no usa: **Project Settings → Data API** → desactivar. Es una capa extra además de RLS.
- **Exige SSL**: **Project Settings → Database → SSL Configuration → Enforce SSL on incoming connections**, una vez que todo funcione.
- **Borra la base de Render** (`punto-neutro-db`) cuando lleves unos días sin problemas. La gratuita expira sola a los 30 días.
- **Ten presente el plan gratuito de Supabase**: 500 MB de base (las imágenes del panel cuentan; revisa **Database → Usage**) y el proyecto **se pausa tras 7 días sin actividad**. Se reactiva desde el dashboard; con visitas normales al sitio no debería pasar.
- **Respaldos**: el plan gratuito no ofrece descargas de respaldo. Antes de cambios grandes, puedes copiar Supabase a tu Postgres local vacío con el mismo `db:copy` (origen Supabase, destino local).

## Desarrollo local y tests

- Para desarrollar, sigue usando Postgres local (`docker compose up -d`); no hace falta definir `DIRECT_URL` ni `DATABASE_SSL_CA`.
- `TEST_DATABASE_URL` **nunca** debe apuntar a Supabase: los tests borran tablas.
- Si agregas un modelo nuevo, su migración debe incluir `ALTER TABLE "<Tabla>" ENABLE ROW LEVEL SECURITY;` (el test `server/tests/db.test.ts` falla si falta) y la tabla se suma a `TABLES` en `server/prisma/copy-data.ts`.

## Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| `self-signed certificate in certificate chain` | Falta `DATABASE_SSL_CA` (o `TARGET_DATABASE_SSL_CA` al copiar), o está incompleto. Pega el certificado completo. |
| `Tenant or user not found` / `password authentication failed` | En los *poolers* el usuario es `postgres.<ref>`, no `postgres`. Revisa la clave y codifica caracteres especiales. |
| `ENETUNREACH` o `getaddrinfo ENOTFOUND db.<ref>.supabase.co` | Estás usando la conexión directa (IPv6). Usa las URLs de los *poolers*. |
| `db:deploy` se queda pegado o falla con *advisory lock* | `DIRECT_URL` falta o apunta al puerto `6543`. Debe ser el **Session pooler** (`5432`). |
| `max clients reached` | `DATABASE_URL` apunta al Session pooler. La API debe usar el **Transaction pooler** (`6543`). |
| `db:copy`: *no tienen las mismas migraciones* | Ejecuta `pnpm db:deploy` contra ambas bases (paso 5.B.2 y paso 4). |
| `db:copy`: *el destino ya tiene datos* | El seed ya corrió en Supabase (por ejemplo, Render desplegó antes de copiar). Si **solo** tiene el contenido inicial, vacíalo en Supabase → **SQL Editor** con `TRUNCATE "User", "Media", "SiteSettings", "TeamMember", "Trend", "Interview", "GlossaryTerm", "PodcastEpisode", "MailboxSubmission", "AuditLog" RESTART IDENTITY CASCADE;` y repite la copia. Revisa bien que estés en el proyecto de Supabase antes de ejecutarlo. |
| Error de certificado al leer la base de Render | Cambia `?sslmode=require` por `?sslmode=no-verify` en `SOURCE_DATABASE_URL`. |
