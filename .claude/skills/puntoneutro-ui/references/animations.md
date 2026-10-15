# Animaciones de Punto Neutro

Principio: **anima para orientar, no para decorar**. Movimiento corto (≤ 520 ms), desplazamientos pequeños (≤ 18 px) y nunca bucles salvo el spinner.

## Recetas disponibles (`web/src/styles/global.css`)

| Clase / técnica | Efecto | Uso |
|---|---|---|
| `.reveal` | Aparición al hacer scroll (opacidad + 18 px) con **scroll-driven animations** (`animation-timeline: view()`, rango `entry 0% → 55%`) | Bloques de contenido de páginas públicas |
| `.stagger` | Entrada escalonada (50 ms entre hijos, máx. 250 ms) al montar | Grillas y listas que cargan datos |
| `.lift` | Elevación de 3 px + sombra al pasar el mouse o con foco dentro | Tarjetas enlazadas |
| `.link-arrow` | La flecha se desplaza 3 px | Enlaces «Ver más» |
| `viewTransition` en `<Link>/<NavLink>` | Fundido entre páginas (View Transitions API, 260 ms) | Toda navegación del sitio |
| `<dialog>` + `@starting-style` | Fundido + escala 0.97 → 1 con `transition-behavior: allow-discrete` | `Dialog` |
| `grid-template-rows: 0fr → 1fr` | Despliegue de alto sin medir en JS | Reformulación del glosario |
| `.toast` | Entrada de 8 px | Notificaciones |

## Reglas

1. **Progresivo**: `.reveal` va dentro de `@supports ((animation-timeline: view()) and (animation-range: entry))`. Sin soporte (Firefox), el contenido aparece sin animación: es decorativo y no lleva *fallback*.
2. **Reducir movimiento**: todo desplazamiento va dentro de `@media (prefers-reduced-motion: no-preference)` o se anula en `reduce`. No uses el truco global de `animation-duration: 0.01ms`.
3. Solo propiedades del compositor (`opacity`, `translate`, `scale`, `rotate`). Nada de animar `width/height/top/left/box-shadow` en bucle.
4. Capturas de pantalla con página completa no hacen scroll: verás `.reveal` en opacidad 0. Para revisar layout, emula `reducedMotion: 'reduce'` en Playwright.
5. Sin animaciones automáticas en la portada (la ilustración del hero es estática a propósito).
