# Fuente del manual de uso

El entregable es **[`docs/manual-de-uso.pdf`](../manual-de-uso.pdf)**: el manual del panel para el equipo editorial, sin lenguaje técnico.

| Archivo | Contenido |
|---|---|
| `manual.html` | Texto del manual (capítulos, pasos, recuadros y figuras). |
| `portada.html` | Portada (se imprime sin pie de página). |
| `estilos.css` | Diseño de impresión A4 con la paleta y las tipografías de Punto Neutro. |
| `capturas/` | Capturas del panel tomadas en un entorno local con datos de ejemplo. |
| `fuentes/` | Lora y Montserrat, para que el PDF no dependa de internet. |
| `render.cjs` / `generar.py` | Convierten el HTML a PDF con Chromium y calculan las páginas del índice. |

## Regenerar el PDF

Requiere Node con [Playwright](https://playwright.dev) y Python con `pypdf`:

```bash
npm i -g playwright && npx playwright install chromium   # una vez
pip install pypdf                                         # una vez
python3 docs/manual/generar.py
```

Si Playwright está instalado en otra carpeta, usa `NODE_PATH=/ruta/a/node_modules`. Si quieres usar un Chromium ya instalado, usa `CHROMIUM_PATH=/ruta/al/chromium`.

## Cuándo actualizarlo

Cada vez que cambie algo visible del panel (botones, secciones o pasos). Reemplaza la captura en `capturas/` con el mismo nombre, ajusta el texto en `manual.html` y vuelve a generar el PDF. El índice y la numeración de las imágenes se actualizan solos.
