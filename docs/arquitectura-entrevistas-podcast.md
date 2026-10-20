# Arquitectura: entrevistas por categoría y tarjetas de podcast

Este documento describe el modelo de datos, la API, los componentes y la lógica (sitio público y panel) de dos funciones:

1. **Entrevistas por categoría:** Expertas, Influencers y Personas comunes.
2. **Tarjetas de podcast dinámicas:** carátula, título, resumen, palabras clave y enlace directo a SoundCloud, con su CRUD en el panel.

Para usar estas funciones en el panel, ver el manual: capítulos 6 y 8 de [`manual-de-uso.pdf`](manual-de-uso.pdf).

---

## 1. Modelo de datos

### 1.1 Correspondencia con los nombres pedidos

| Pedido | Implementado | Por qué |
|---|---|---|
| `categoria`: `expertas` · `influencers` · `personas_comunes` | `Interview.category`, enum `InterviewCategory`: `EXPERTAS` · `INFLUENCERS` · `PERSONAS_COMUNES` | Un enum de Postgres impide valores inválidos a nivel de base. Va en mayúsculas para seguir la convención del resto de los enums (`ContentStatus`, `Role`…). En la URL pública se usan slugs en minúscula: `expertas`, `influencers`, `personas-comunes`. |
| `titulo` | `PodcastEpisode.title` | El código va en inglés y los textos en español (convención del repo). |
| `url_imagen` | `PodcastEpisode.coverId` → `Media` (se sirve en `/api/media/:id`) | Las imágenes del sitio viven en la biblioteca de medios (Postgres). Una URL externa rompería la CSP (`img-src 'self'`), podría desaparecer y no tendría texto alternativo ni límite de peso. Al borrar la imagen, `onDelete: SetNull` deja la tarjeta con la ilustración por defecto. |
| `resumen` | `PodcastEpisode.summary` | Reemplaza a `description`: la columna **se renombró**, así que no se perdieron datos. |
| `url_soundcloud` | `PodcastEpisode.soundcloudUrl` | Se guarda en forma canónica (§3). |
| `palabras_clave` (array) | `PodcastEpisode.tags String[]` | Es un array nativo de Postgres (`text[]`), sin tabla intermedia: son pocas por episodio y no tienen datos propios. |

### 1.2 Esquema Prisma (extracto)

```prisma
enum InterviewCategory {
  EXPERTAS          // especialistas: psicología, salud, comunicación…
  INFLUENCERS       // creadoras de contenido e influencers digitales
  PERSONAS_COMUNES  // personas sin exposición pública
}

model Interview {
  // …campos existentes…
  category InterviewCategory          // obligatoria, sin valor por defecto
  @@index([category, status, publishedAt])
}

model PodcastEpisode {
  id            Int       @id @default(autoincrement())
  number        Int?
  title         String
  summary       String    @default("")
  tags          String[]  @default([])
  coverId       Int?
  cover         Media?    @relation("EpisodeCover", fields: [coverId], references: [id], onDelete: SetNull)
  guests        String    @default("")
  soundcloudUrl String
  durationMin   Int?
  published     Boolean   @default(false)
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 1.3 Migración sin pérdida de datos

`server/prisma/migrations/20261021120000_categorias_entrevistas_tarjetas_podcast/migration.sql` se escribió a mano a partir de `prisma migrate diff`. El SQL generado tenía dos problemas:

- **`category NOT NULL` sin valor por defecto** fallaba con las entrevistas que ya existían. La solución es agregar la columna con `DEFAULT 'INFLUENCERS'` y quitar ese valor por defecto enseguida:
  - las entrevistas existentes nacieron del formato original de la propuesta («creadoras de contenido»), por eso quedan como Influencers;
  - las nuevas deben elegir su categoría.
- **`DROP COLUMN description`** borraba los textos ya escritos. Se usa `RENAME COLUMN description TO summary`.

Después de aplicarla, `prisma migrate diff --from-config-datasource` sale vacío: la base coincide con el esquema.

---

## 2. API

### 2.1 Pública (solo contenido publicado)

| Método y ruta | Uso |
|---|---|
| `GET /api/interviews?category=EXPERTAS` | Lista entrevistas publicadas e incluye `category`. Sin `category`, o con un valor desconocido, devuelve todas. Se ignora un valor inválido en vez de responder 400 porque es una consulta pública. |
| `GET /api/interviews/:slug` | Detalle; incluye `category`. |
| `GET /api/podcast?tag=salud%20mental` | Episodios publicados. `tag` filtra sin distinguir mayúsculas ni tildes (`tagKey`). |

### 2.2 Panel (`requireAuth` + CSRF + `audit()`)

`crudRouter` genérico en `server/src/routes/admin/index.ts`:

| Ruta | Validación |
|---|---|
| `GET/POST /api/admin/interviews`, `PUT/DELETE /api/admin/interviews/:id` | `interviewSchema`: `category` es obligatoria (`z.enum(…, 'Elige la categoría de la entrevista.')`). |
| `GET/POST /api/admin/podcast`, `PUT/DELETE /api/admin/podcast/:id` | `podcastSchema`: título 3–160, resumen 10–600, `tags` (≤ 8, ≤ 30 caracteres cada una), `coverId`, `soundcloudUrl`. |

Todos los errores de validación vuelven como `{ fields: { campo: mensaje } }` en español, y el panel los muestra bajo cada campo.

---

## 3. Validación compartida (un solo código para API y navegador)

La validación vive en dos módulos de TypeScript puro, sin dependencias:

- `server/src/lib/soundcloud.ts`
- `server/src/lib/tags.ts`

La API los usa dentro de zod (`transform` + `ctx.addIssue`). El panel los reexporta desde `web/src/lib/soundcloud.ts` y los usa en `validate` de cada campo, así que la persona ve el error **antes** de enviar y las reglas no se pueden desalinear.

### `normalizeSoundcloudUrl(input) → { ok: true, url } | { ok: false, error }`

| Entrada | Resultado |
|---|---|
| `https://soundcloud.com/usuaria/episodio` | ✅ igual |
| `https://www.soundcloud.com/…` · `https://m.soundcloud.com/…` (celular) | ✅ se normaliza a `https://soundcloud.com/…` |
| `…/episodio?si=abc&utm_source=x#t=1:00` | ✅ se quitan los parámetros de rastreo y el fragmento |
| `https://on.soundcloud.com/AbC12` (enlace corto de la app) | ✅ se conserva |
| `https://soundcloud.com/usuaria` (perfil, no episodio) | ❌ «Ese enlace es de un perfil, no de un episodio…» |
| `https://w.soundcloud.com/player/…` · `api.soundcloud.com` | ❌ «Ese es el código para insertar…» |
| `https://youtube.com/…`, `soundcloud.com.evil.cl`, texto suelto | ❌ «El enlace debe ser de SoundCloud…» |

El host se compara **exacto** contra una lista blanca, nunca con «termina en» o «contiene». Así se descartan dominios parecidos.

### `normalizeTags(tags)`

Para cada palabra clave:

1. Quita el `#` inicial.
2. Colapsa espacios.
3. Deduplica por `tagKey`, que pasa a minúsculas y quita las tildes.

Se conserva la escritura de la primera aparición: `['#Salud mental', 'salud  mental']` → `['Salud mental']`.

---

## 4. Frontend: componentes

```
web/src
├── ui/Tabs.tsx                         Pestañas WAI-ARIA reutilizables + tabPanelProps()
├── lib/types.ts                        InterviewCategory, INTERVIEW_CATEGORIES (key, slug, label, singular, description), PodcastEpisode
├── lib/soundcloud.ts                   Reexporta la validación del servidor
├── site/components/PodcastCard.tsx     Tarjeta del episodio (sitio y vista previa del panel)
├── site/pages/InterviewsPage.tsx       Pestañas por categoría + InterviewCard
├── site/pages/InterviewDetailPage.tsx  Insignia de categoría enlazada a su sección
├── site/pages/PodcastPage.tsx          Grilla de PodcastCard + filtro por palabra clave
├── site/pages/HomePage.tsx             «Último episodio» con carátula y categoría en la entrevista destacada
├── admin/components/InterviewCategoryPicker.tsx   Radios como tarjetas + SUGGESTED_QUESTIONS
├── admin/components/CrudDialogPage.tsx            + validate por campo, + preview del ítem en edición
├── admin/pages/InterviewsAdmin.tsx     Filtro y columna de categoría; categoría obligatoria en el editor
└── admin/pages/PodcastAdmin.tsx        CRUD de tarjetas con vista previa en vivo
```

### `<Tabs>` (`@/ui`)

- **Props:** `tabs: { key, label, count? }[]`, `value`, `onChange`, `idPrefix`, `label`.
- **Accesibilidad:** sigue el patrón WAI-ARIA «tabs».
  - Solo la pestaña activa entra en el orden de Tab (*roving tabindex*).
  - ← → recorren las pestañas en círculo; Inicio y Fin van a la primera y la última.
  - Cada pestaña usa `aria-selected` y `aria-controls`.
- **Panel:** el contenido se renderiza aparte con `tabPanelProps(idPrefix, key)`.
- **Móvil:** la barra se desplaza en horizontal en vez de partirse en dos líneas.

### `<PodcastCard episode onTagClick? activeTag? headingLevel? preview?>`

**Tipo de datos.** `PodcastCardData` exige solo lo que la tarjeta pinta. Por eso sirve igual para un episodio guardado y para el formulario a medio llenar del panel.

**Estructura:**

1. Carátula cuadrada (`aspect-ratio: 1/1`, `object-fit: cover`, `loading="lazy"`). Si no hay carátula, muestra la ilustración del podcast.
2. Metadatos: «Episodio N · min · fecha».
3. Título (`h2` o `h3` según el contexto).
4. Invitadas e invitados.
5. Resumen (máximo 5 líneas con `line-clamp`).
6. Palabras clave.
7. Acciones.

**Acciones:**

- **«Escuchar en SoundCloud»:** enlace externo con `target="_blank" rel="noopener noreferrer"` y aviso para lectores de pantalla.
- **«Escuchar aquí»:** monta el iframe de SoundCloud **solo al pedirlo**. Una grilla de 10 episodios no descarga 10 reproductores. El botón usa `aria-expanded` y `aria-controls`.

**Palabras clave:** con `onTagClick` son botones con `aria-pressed` que filtran; sin él, etiquetas de texto.

**`preview`:** sin enlaces ni botones, con textos de ejemplo («Título del episodio», «Aquí va el resumen…») mientras el formulario está vacío.

### `<InterviewCategoryPicker value onChange error?>`

- **Estructura:** `fieldset` + `legend` con tres `input type="radio"` reales. Cada opción se ve como tarjeta, con nombre y descripción de la sección.
- **Accesibilidad:** foco visible con `:has(input:focus-visible)`. Con error usa `aria-invalid` y un mensaje `role="alert"`.

### `CrudDialogPage` (genérico del panel)

Se agregaron tres opciones:

- `validate?: (value) => string | undefined` por campo, que se revisa antes de enviar.
- `max` y `placeholder` para listas.
- `preview?: (item) => ReactNode`, que muestra una vista previa en vivo dentro del diálogo.

---

## 5. Lógica de la vista pública

### Entrevistas (`/entrevistas`)

**Estado en la URL.** La pestaña activa se guarda en `?categoria=expertas|influencers|personas-comunes`, así:

- el enlace se puede compartir;
- el botón «atrás» funciona;
- la insignia del detalle lleva directo a su sección.

Un slug desconocido cae en «Todas».

**Carga.** Se hace **una sola** petición (`GET /api/interviews`) y se agrupa en el cliente con `useMemo` en `Record<InterviewCategory, Interview[]>`. Con eso los contadores de las pestañas salen gratis, y cambiar de pestaña es instantáneo, sin pedir nada al servidor.

**Pestaña «Todas»:**

- Muestra una sección por categoría con título, descripción y las **2 más recientes**.
- Si una categoría tiene más, aparece «Ver las N →», que cambia de pestaña.
- Las categorías vacías no se muestran.

**Pestaña de una categoría:** muestra su descripción y todas sus entrevistas. Si está vacía, muestra un estado vacío empático con el botón «Ver todas las entrevistas».

**Detalle:** muestra una insignia con la categoría, enlazada a `/entrevistas?categoria=<slug>`.

**Portada:** la entrevista destacada muestra su categoría.

### Podcast (`/podcast`)

**Datos.** `GET /api/podcast` trae los episodios publicados. `collectTags()` arma la lista de palabras clave sin duplicados (por `tagKey`), ordenada de la más usada a la menos usada, con su contador.

**Filtro.** Se guarda en `?tema=…` (compartible). Se puede activar desde los chips superiores o desde las palabras clave de cada tarjeta; tocar de nuevo el tema activo lo quita. El conteo «N episodios sobre «tema»» se anuncia con `aria-live`.

**Grilla.** Usa `repeat(auto-fill, minmax(min(100%, 300px), 1fr))`: 1 columna en móvil, 2 o 3 en escritorio, sin *media queries*.

**Estados:**

- skeleton mientras carga;
- error con reintento;
- «El primer episodio viene en camino» si no hay episodios;
- «No hay episodios sobre «tema»» con un botón para ver todos.

**Portada.** El bloque «Último episodio» muestra carátula, título y palabras clave, con el botón a SoundCloud. Ya no carga un iframe en la portada.

---

## 6. Lógica del panel

### Entrevistas

**Lista:**

- Chips «Todas / Expertas / Influencers / Personas comunes» con contadores.
- Columna «Categoría».

**Editor:** la categoría es lo primero del formulario, y es obligatoria tanto en el cliente como en la API.

- **Tipado.** El formulario usa `Omit<Interview, 'category'> & { category: InterviewCategory | '' }`. El estado «sin elegir» existe solo en el formulario; el tipo `Interview` nunca acepta `''`.
- **Preguntas sugeridas.** Al elegir una categoría, se completan las preguntas que estén **vacías o que aún tengan la sugerencia de la categoría anterior**. Una pregunta escrita por el equipo nunca se pisa.
- **Antes de elegir:** las preguntas muestran un *placeholder* que invita a elegir la categoría primero.

### Podcast (CRUD completo)

| Operación | Detalle |
|---|---|
| **Listar** | Miniatura de la carátula (o ícono), N° y duración, palabras clave como insignias, fecha y estado (Publicado/Borrador). Incluye buscador por título, invitados, resumen y palabras clave. |
| **Crear / editar** | Diálogo con título, enlace de SoundCloud, resumen (con contador), palabras clave (Enter agrega, × quita, máximo 8, duplicados ignorados), carátula desde la biblioteca de medios, N°, duración, invitados y «Publicado». Al final va la **vista previa en vivo** con el mismo `PodcastCard` del sitio. |
| **Validar** | Antes de enviar: obligatorios, enlace de SoundCloud (`normalizeSoundcloudUrl`) y largo de las palabras clave. La API vuelve a validar todo, y si devuelve errores, se muestran en su campo. |
| **Eliminar** | Pide confirmación con `useFeedback().confirm` antes de borrar. |
| **Publicar** | Al publicar por primera vez se fija `publishedAt`; esa fecha se mantiene si el episodio se despublica y se vuelve a publicar. |

---

## 7. Responsividad, accesibilidad y diseño

- Se usan solo tokens de la paleta Positive Feminism, que funcionan en modo claro y oscuro. No se agregaron colores nuevos.
- Se verificó en 375 px y en escritorio, claro y oscuro, sin desborde horizontal. Al revisar se encontró un desborde previo en las tablas del panel en móvil: el texto oculto «Acciones» tenía `position: absolute` y escapaba del contenedor con scroll. Se corrigió con `.table-wrap { position: relative }`.
- Hay foco visible en pestañas, chips, palabras clave y tarjetas de categoría. Todas las áreas táctiles miden 32 px o más (chips de palabras clave) y 44 px en pestañas y botones.
- Las animaciones siguen el sistema: sutiles y desactivadas con `prefers-reduced-motion`.

---

## 8. Pruebas

**API (`server/tests/`):**

- `podcast-lib.test.ts`: normalización de SoundCloud y de palabras clave.
- `api.test.ts`, «Entrevistas por categoría»: categoría obligatoria, filtro público, valor inválido ignorado.
- `api.test.ts`, «Tarjetas de podcast»: enlace limpio, rechazo de otros sitios, palabras clave deduplicadas, máximo 8, CRUD completo y filtro `?tag=`.

**Web (`web/src/test/entrevistas-podcast.test.tsx`):**

- teclado de `Tabs`;
- pestañas de entrevistas sincronizadas con la URL;
- `PodcastCard`: enlace externo, reproductor diferido y vista previa sin enlaces;
- filtro por tema sin distinguir mayúsculas ni tildes;
- selector de categoría accesible;
- validación compartida.

**Verificación:** `pnpm typecheck && pnpm test && pnpm build`.

---

## 9. Posibles siguientes pasos (no incluidos)

- **Filtrar las palabras clave en SQL** (`has` / `hasSome`) si el podcast supera algunos cientos de episodios. Hoy se filtra en memoria porque así no se distinguen tildes ni mayúsculas sin crear una columna normalizada.
- **Carátula automática desde SoundCloud (oEmbed)**, como sugerencia cuando no se sube una propia.
