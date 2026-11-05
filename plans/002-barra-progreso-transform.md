# 002 — La barra de progreso de scroll anima `transform`, no `width`

- **Status**: DONE
- **Commit**: 680ed60
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 archivos, ~10 líneas

## Problem

La barra de progreso del scroll cambia su `width` en cada evento de scroll. `width` es una propiedad de maquetación:
en cada fotograma de scroll el navegador recalcula la maquetación y vuelve a pintar, en las 5 páginas del sitio
(todas cargan `script/scripts.js`). Además, la transición de 100 ms hace que la barra vaya siempre un poco por detrás
del scroll.

```css
/* src/styles.css:140-150 — actual */
.scroll-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #34d399);
  width: 0%;
  transition: width 0.1s linear;
  z-index: 100;
  border-radius: 0 2px 2px 0;
}
```

```js
// script/scripts.js:103-107 — actual
if (scrollProgress) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    scrollProgress.style.width = pct + '%';
}
```

## Target

La barra ocupa siempre el 100 % del ancho y se escala en horizontal desde la izquierda. `transform` solo recompone
en la GPU, sin maquetar ni pintar. Sin transición: un valor que sigue al scroll debe ir pegado a él.

```css
/* target */
.scroll-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #34d399);
  transform: scaleX(0);
  transform-origin: left center;
  will-change: transform;
  z-index: 100;
}
```

```js
// target
if (scrollProgress) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const p = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
    scrollProgress.style.transform = `scaleX(${p})`;
}
```

El `border-radius: 0 2px 2px 0` se quita: con `scaleX` la esquina se deformaría, y en una barra de 3 px no se nota.

## Repo conventions to follow

- El CSS fuente es `src/styles.css`; se compila con `npm run build:css` a `css/styles.css`. No edites `css/styles.css` a mano.
- Los temas de cada producto solo cambian el degradado (`src/styles.css:1508`, `:1554`, `:1601`, `:1648`,
  `body.theme-* .scroll-progress { background: … }`). No hay que tocarlos: siguen funcionando.

## Steps

1. En `src/styles.css:140-150`, sustituye el bloque `.scroll-progress` por el del Target.
2. En `script/scripts.js:103-107`, sustituye el bloque `if (scrollProgress) { … }` por el del Target.
3. `npm run build:css`.

## Boundaries

- Toca solo `.scroll-progress` y ese bloque del JS. NO cambies `updateScrollChrome` ni los listeners.
- NO cambies los colores de los temas.
- Si el código no coincide con los extractos (cambió desde 680ed60), PARA e informa.

## Verification

- **Mecánica**: `npm run build:css` sin errores; `node --check script/scripts.js`.
- **Feel check** (portada y una página de producto, p. ej. `/actapro/`):
  - Al bajar, la barra crece de izquierda a derecha pegada al scroll, sin ir por detrás.
  - Arriba del todo no se ve; al final de la página llega al borde derecho.
  - En `/actapro/` conserva su degradado índigo.
  - En DevTools → Rendering → «Paint flashing», al hacer scroll la barra NO destella en verde.
  - En el panel Performance, un scroll ya no muestra «Layout» por cada fotograma causado por `.scroll-progress`.
- **Done when**: no queda ningún `width` animado en `.scroll-progress` y el JS asigna `transform: scaleX(...)`.
