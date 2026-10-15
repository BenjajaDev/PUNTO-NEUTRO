---
name: puntoneutro-ui
description: Sistema de diseño, UX, accesibilidad y animaciones de Punto Neutro (sitio periodístico sobre neutralidad corporal y su panel de administración, React + Vite). Úsala SIEMPRE que se cree o modifique cualquier página, componente visual, estilo, color, tipografía, tarjeta, botón, formulario, diálogo/confirmación, carga (skeleton/spinner), toast, transición o animación — en el sitio o en el panel — aunque el pedido no diga "diseño" ni "UI" (ej. "agrega una sección", "haz que el glosario se vea mejor", "pide confirmación antes de borrar", "muestra que está cargando", "el botón se ve mal en modo oscuro"). También para revisar accesibilidad o consistencia visual.
---

# Punto Neutro · UI / UX / Animaciones

Estética **editorial, cercana y contenida** (referencias: LatFem, Psi Mammoliti). El tema es sensible (imagen corporal, adolescentes, relatos personales): la interfaz transmite calma, nunca urgencia ni juicio. Orden visual, aire generoso y movimiento mínimo.

Detalle de componentes: `references/components.md`. Animaciones: `references/animations.md`.

## 1. Tokens (fuente única: `web/src/theme/tokens.ts`)

Paleta «Positive Feminism» de la propuesta, con su rol:

| Color | Hex | Rol |
|---|---|---|
| Rosa suave | `#F49A9C` | acento cálido: CTA secundarios, detalles (`--color-accent`, texto encima `--color-on-accent`) |
| Blanco crema | `#EFE9D7` | fondo neutro (`--color-background`) |
| Lila medio | `#9169A4` | bordes y elementos secundarios (`--color-border-strong`, `--color-secondary`) |
| Morado profundo | `#7D4C97` | identidad: botón principal, navegación activa (`--color-primary`) |
| Magenta suave | `#B96EB2` | resaltado (`--color-highlight`); enlaces usan `--color-link` (versión con contraste AA) |
| Lavanda claro | `#D198C5` | citas y testimonios (`--color-quote` + `--color-on-quote`), fondos de sección (`--color-section`) |

- **Prohibido el hex suelto** en componentes/CSS: usa `var(--color-*)`, `var(--gradient-*)` o `var(--palette-*)` (este último solo para ilustraciones decorativas).
- ¿Falta un color? Agrégalo en **ambos** temas de `tokens.ts` y, si lleva texto, su par en `contrastPairs`. `pnpm --filter web test` (contrast.test) falla si no cumple WCAG AA o si falta en un tema. `node scripts/syncTokens.ts` regenera el CSS (corre solo en dev/build).
- Estados: `success|danger|warning|info` (relleno) + `*-text` (texto) + `*-soft` (fondo suave) + `on-*` (texto sobre relleno).
- Tema oscuro: sigue al sistema; el botón de la cabecera guarda preferencia solo si difiere del sistema (`lib/useTheme.ts`). Nunca asumas fondo claro.

## 2. Tipografía y espacios

- Títulos: **Lora** (`--font-serif`, peso 600, `text-wrap: balance`). Cuerpo y navegación: **Montserrat** (`--font-sans`). Autoalojadas con `@fontsource-variable` (sin peticiones a Google).
- Lectura larga: `.prose` (17 px, interlineado 1.75) y ancho `.reading` (720 px).
- Escalas: `--space-*`, radios `--radius-md 12` (inputs) · `lg 16` (tarjetas) · `xl 22` (diálogos) · `pill` (botones, chips).
- Estructura de página pública: `PageHero` (eyebrow + h1 + intro) → `.section` / `.section--tight` / `.section--tinted` → `.container`.

## 3. Componentes (`import { … } from '@/ui'`)

Reutiliza antes de crear: `Button` (primary/accent/secondary/ghost/danger + `loading`), `buttonClass()` para enlaces con forma de botón, `Card`, `Badge`, `TextField`, `TextArea` (`showCount`), `SelectField`, `Switch`, `Checkbox`, `Dialog` (`<dialog>` nativo), `Spinner`, `Skeleton`, `SkeletonCards`, `SkeletonRows`, `EmptyState`, `ErrorState`, `PageHeader`, `StatTile`. Sitio: `SectionHeading`, `PageHero`, `Prose`, `TrendCard`, `SoundCloudPlayer`, `Logo`. Panel: `CrudDialogPage`, `ImagePicker`, `ListField`, `useEntityEditor`, `useUnsavedChanges`.

## 4. Feedback y asincronía (reglas del producto)

```ts
const { confirm, runBlocking, notify } = useFeedback();
```

- **Acción crítica ⇒ `confirm()`**: eliminar, publicar/despublicar, aprobar un relato del buzón, cambiar roles, cerrar sesión, guardar configuración pública. Con `onConfirm` la acción corre dentro del diálogo (botón en carga) y si falla el error queda en el mismo diálogo. Tono `danger` para destructivas, `brand` para publicar.
- **Espera iniciada por la persona ⇒ `runBlocking('Guardando…', tarea)`**; carga de listas ⇒ skeletons. Nunca un spinner sin texto.
- **Resultado ⇒ `notify()`** (toast) con mensaje en español; errores de la API ya vienen en español (`ApiError.message`) y por campo (`ApiError.fields` → prop `error` de cada campo).
- Validación: error junto al campo, foco al primer campo inválido; nunca un modal por error.
- Formularios largos del panel: `useUnsavedChanges(dirty)` (confirma al salir con cambios).

## 5. Accesibilidad (checklist)

- HTML semántico (`header/nav/main/section/article/aside/footer`, `h1` único por página), enlace «Saltar al contenido», foco al `main` al cambiar de ruta.
- Botones solo-icono con `aria-label` en español; `aria-pressed` en filtros (chips), `aria-expanded`+`aria-controls` en desplegables.
- Área táctil ≥ 44 px. Foco visible (`--color-focus-ring`).
- Estado nunca solo por color: icono + texto (badges «Publicado», «Borrador», «Anónimo»…).
- Enlaces externos: `target="_blank" rel="noopener noreferrer"` + aviso «(se abre en otra pestaña)».
- Tarjetas clicables: un solo enlace con `.stretched-link` (sin anidar interactivos).

## 6. Tono y UX editorial

- Lenguaje empático, no culpabilizador, sin tecnicismos; tuteo; español de Chile con tildes.
- **Buzón**: anonimato activado por defecto, consentimiento explícito, nunca publicar el texto original (solo el extracto editado), recordar el recurso de ayuda (Salud Responde).
- Imágenes de cuerpos: evitar fotos que refuercen cánones; sin imagen se usan las portadas generadas con la paleta (`TrendCover`).
- Vacíos amables («Pronto publicaremos…»), nunca pantallas en blanco.

## 7. Animaciones (sutiles)

Solo `opacity` y `translate/scale/rotate` (compositor). Duraciones `--duration-fast 160` · `base 240` · `slow 520`, curva `--ease-out`. Recetas en `references/animations.md`. **Nada se mueve solo** (sin carruseles automáticos ni fondos animados) y todo respeta `prefers-reduced-motion`.

## 8. Antes de terminar

Claro y oscuro · móvil 375 px sin scroll horizontal · sin hex nuevos · componentes de `@/ui` · `confirm` en acciones críticas · skeleton/overlay en esperas · labels y roles · reducir movimiento · `pnpm --filter web test && pnpm --filter web typecheck`.
