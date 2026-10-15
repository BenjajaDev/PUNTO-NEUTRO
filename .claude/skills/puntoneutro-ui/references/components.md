# Catálogo de componentes

## `web/src/ui` (sitio y panel)

| Componente | Props clave | Notas |
|---|---|---|
| `Button` | `variant` (primary, accent, secondary, ghost, danger), `size` (sm, md, lg), `icon`, `iconRight`, `loading`, `block` | `loading` deshabilita y anuncia `aria-busy`; solo icono ⇒ `aria-label` obligatorio |
| `buttonClass(opts)` | mismas opciones | para `<Link>`/`<a>` con forma de botón |
| `Card` | `variant` (raised, quote, section) | `.lift` para elevación en hover |
| `Badge` | `tone` (brand, accent, success, warning, danger, info, neutral), `icon` | estado con texto, no solo color |
| `TextField` / `TextArea` / `SelectField` | `label`, `hint`, `error`, `showCount` (TextArea) | error asociado con `aria-describedby` + `aria-invalid` |
| `Switch` | `label`, `description`, `checked`, `onChange` | `role="switch"` |
| `Checkbox` | `children` (texto), `error` | consentimientos |
| `Dialog` | `open`, `tone`, `title`, `message`, `wide`, `dismissible`, `actions`, `onClose` | `<dialog>` nativo con `showModal()` |
| `useFeedback()` | `confirm`, `runBlocking`, `notify` | ver SKILL.md §4 |
| `Spinner`, `Skeleton`, `SkeletonCards`, `SkeletonRows` | `label` | cargas |
| `EmptyState`, `ErrorState` | `icon`, `title`, `message`, `action` / `onRetry` | vacíos y errores |
| `PageHeader`, `StatTile` | | panel |

## Sitio (`web/src/site/components`)

`SectionHeading` (eyebrow, title, intro, action) · `PageHero` · `Prose` (texto → párrafos) · `TrendCard` / `TrendCover` (portada generada por plataforma) · `SoundCloudPlayer` · `Logo` / `LogoMark` · iconos sociales.

## Panel (`web/src/admin/components`)

`CrudDialogPage` (tabla + búsqueda + formulario en diálogo + borrar con confirmación; campos text/textarea/number/switch/list/image/url) · `useEntityEditor` (editor de página completa con borrador/publicar) · `ImagePicker` (biblioteca + subida) · `ListField` · `useUnsavedChanges`.
