# 012 — Hovers que no se quedan pegados en el móvil, e inclinación de tarjetas suavizada

- **Status**: DONE
- **Commit**: 9346e08
- **Severity**: MEDIUM
- **Category**: Accessibility / Physicality
- **Estimated scope**: `src/styles.css` (~25 líneas nuevas), `script/scripts.js` (~25 líneas)

## Problem

**1. Hovers en pantallas táctiles.** En un móvil, tocar un elemento le aplica `:hover` y se queda aplicado hasta tocar
otra cosa. Estos hovers mueven el elemento, así que en el móvil se quedan levantados o girados tras tocarlos:

| Línea | Selector | Movimiento |
| --- | --- | --- |
| 205 | `.logo:hover .logo-mark` | `rotate(6deg) scale(1.08)` |
| 402 | `.m3-btn-filled:hover` (y `.btn-primary:hover`) | `translateY(-2px)` |
| 417 | `.m3-btn-tonal:hover` (y `.btn-secondary:hover`) | `translateY(-2px)` |
| 497-498 | `.service-card:hover, .m3-card:hover` | `translateY(-4px)` |
| 533 | `.service-card:hover .card-icon` | `scale(1.08)` |
| 641 | `.stat:hover` | `translateY(-3px)` |
| 711 | `.contact-info-centered li a:hover` | `translateY(-2px)` |
| 738 | `.social-links a:hover` | `translateY(-2px)` |
| 825 | `.back-to-top:hover` | `translateY(-3px)` |
| 851 | `.plan-card:hover` | `translateY(-4px)` |
| 951 | `.video-card:hover` | `translateY(-4px)` |
| 972 | `.video-card:hover .video-thumb img` | `scale(1.03)` |
| 1092 | `.orbit-item:hover` | `translate(var(--tx), var(--ty)) scale(1.15)` |
| 1531 | `.product-back-btn:hover` | `translateY(-1px)` |

(Números de línea de `src/styles.css` en 9346e08; busca cada selector, pueden variar.)

**2. Inclinación de tarjetas con retraso.** `script/scripts.js:270-285` escribe `style.transform` en cada `mousemove`,
pero las tarjetas tienen `transition: transform 0.28s …` (`src/styles.css`, regla `.service-card, .m3-card`). Cada
movimiento del ratón arranca una transición nueva de 280 ms hacia el último punto: la tarjeta va siempre por detrás y se
siente blanda. Al entrar, además, salta de golpe de la elevación del CSS (−4 px) a la del JS (−6 px).

```js
// script/scripts.js:270-285 — actual
// Inclinación 3D en las tarjetas destacadas
const tiltEls = document.querySelectorAll('.service-card, .tech-panel');
tiltEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateX = (0.5 - py) * 8;
        const rotateY = (px - 0.5) * 8;
        el.style.transform =
            `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = '';
    });
});
```

## Target

**1.** Un bloque al final de la sección de componentes (justo antes de `/* --- Respuesta al pulsar --- */`) que anula
el movimiento de esos hovers en pantallas sin ratón. Los cambios de color y sombra del hover se mantienen:

```css
/* En pantallas táctiles el :hover se queda pegado tras tocar: sin movimiento */
@media (hover: none) {
  .logo:hover .logo-mark,
  .btn-primary:hover,
  .m3-btn-filled:hover,
  .btn-secondary:hover,
  .m3-btn-tonal:hover,
  .service-card:hover,
  .m3-card:hover,
  .service-card:hover .card-icon,
  .stat:hover,
  .contact-info-centered li a:hover,
  .social-links a:hover,
  .back-to-top:hover,
  .plan-card:hover,
  .video-card:hover,
  .video-card:hover .video-thumb img,
  .product-back-btn:hover {
    transform: none;
  }

  .orbit-item:hover {
    transform: translate(var(--tx), var(--ty));
  }
}
```

**2.** La inclinación sigue al ratón con un suavizado por fotograma (interpolación hacia el objetivo, como un muelle
suave), sin la transición CSS de `transform` mientras el ratón está dentro. Al salir, se devuelve la transición y la
tarjeta vuelve a su sitio con la curva del sitio.

```js
// target: sustituye script/scripts.js:270-285
// Inclinación 3D en las tarjetas destacadas: sigue al ratón suavizada fotograma a fotograma (la transición CSS de
// transform iría siempre por detrás); al salir vuelve con la transición normal
const tiltEls = document.querySelectorAll('.service-card, .tech-panel');
tiltEls.forEach(el => {
    let target = { rx: 0, ry: 0, lift: 0 }, now = { rx: 0, ry: 0, lift: 0 }, frame = 0;
    const paint = () => {
        for (const k in now) now[k] += (target[k] - now[k]) * 0.2;
        el.style.transform = `perspective(800px) rotateX(${now.rx}deg) rotateY(${now.ry}deg) translateY(${now.lift}px)`;
        const settled = Object.keys(now).every(k => Math.abs(target[k] - now[k]) < 0.01);
        frame = settled ? 0 : requestAnimationFrame(paint);
    };
    el.addEventListener('mouseenter', () => {
        el.style.transitionProperty = 'background-color, box-shadow, scale';
    });
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        target = { rx: (0.5 - py) * 8, ry: (px - 0.5) * 8, lift: -6 };
        if (!frame) frame = requestAnimationFrame(paint);
    });
    el.addEventListener('mouseleave', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        target = { rx: 0, ry: 0, lift: 0 };
        now = { rx: 0, ry: 0, lift: 0 };
        el.style.transitionProperty = '';
        el.style.transform = '';
    });
});
```

Notas:
- La elevación (`lift`) también se interpola, así que al entrar sube suave de 0 a −6 px en vez de saltar.
- `transitionProperty` en línea quita solo `transform` de la lista; `background-color`, `box-shadow` y `scale` (el
  pulsado del plan 005) siguen con sus transiciones del CSS.
- El bloque está dentro de `if (canHover)` y de `if (!prefersReducedMotion)` (líneas 254 y 269): en el móvil y con
  reducir movimiento no se ejecuta.

## Repo conventions to follow

- Bloques JS con comentario `// …` encima, 4 espacios de sangría.
- `src/styles.css` se compila con `npm run build:css`.

## Steps

1. Añade el bloque CSS `@media (hover: none)` del Target justo antes de `/* --- Respuesta al pulsar --- */`.
2. Sustituye el bloque JS de las líneas 270-285 por el del Target.
3. `node --check script/scripts.js` y `npm run build:css`.

## Boundaries

- NO quites los hovers en escritorio ni cambies sus valores.
- NO toques el brillo que sigue al cursor (`spotlightEls`, líneas 256-267) ni el fondo líquido (plan 013).
- Si un selector de la tabla ya no existe, quítalo de la lista y dilo en el informe.

## Verification

- **Mecánica**: los comandos del paso 3.
- **Feel check, escritorio**: pasa el ratón por las tarjetas de Servicios y de la Suite:
  - Al entrar, la tarjeta sube suave (no salta) y se inclina siguiendo al ratón sin ir por detrás.
  - Moviendo el ratón rápido, la inclinación es fluida, sin tirones.
  - Al salir, vuelve a su sitio en unos 280 ms.
  - Pulsar una tarjeta enlace (plan 005) sigue encogiéndola un poco.
  - DevTools → Animations al 10 %: al salir se ve una sola transición de `transform`.
- **Feel check, táctil** (DevTools en modo móvil con táctil, o un móvil real): tocar un botón o una tarjeta no la deja
  levantada ni girada; el color de hover puede quedarse, el movimiento no.
- **Done when**: ningún hover mueve nada en pantallas táctiles y la inclinación ya no va con retraso.
