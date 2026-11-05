# 004 — Respetar «reducir movimiento» en todo el sitio, no solo en las View Transitions

- **Status**: DONE
- **Commit**: 680ed60
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 2 archivos (`src/styles.css`, `script/scripts.js`), ~35 líneas

## Problem

Quien activa «reducir movimiento» en su sistema lo hace porque el movimiento le marea o le distrae. El sitio solo lo
respeta en las View Transitions:

```css
/* src/styles.css:1447-1454 — actual: único bloque prefers-reduced-motion */
/* Accesibilidad: Respetar preferencias de reducción de movimiento */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

Con la preferencia activada siguen moviéndose, sin fin y en todas las páginas:

| Qué | Dónde | Movimiento |
| --- | --- | --- |
| 3 manchas de luz del fondo | `src/styles.css:112`, `:121`, `:130` (`.liquid-bg .blob-1/2/3`) | `m3-pulse` 16–20 s, escala y traslación infinitas |
| Cinta de logos | `src/styles.css:1331` (`.marquee-track`) | `marquee-scroll` 30 s, desplazamiento horizontal infinito |
| Punto del chip del hero | clase Tailwind `animate-pulse` en `index.html:97` y en las 4 páginas de producto | pulso infinito |
| Órbita (solo `/restaurant/`) | `src/styles.css:1034` `.orbit-core`, `:1050` `.orbit-ring`, `:1074` `.orbit-item` | giro infinito de 26 s y pulso de 4 s |
| Pulsos de los conectores | `src/styles.css:1261` `.platform-pulse` | punto que recorre la línea cada 2,4 s |
| Aparición al hacer scroll | `src/styles.css:1306-1316` `.reveal` | sube 24 px |
| Scroll suave | `src/styles.css:65` `scroll-behavior: smooth`; `script/scripts.js:93` `behavior: 'smooth'` | desplazamiento animado de toda la página |

La inclinación de tarjetas, el parallax, el conteo de cifras y el giro de la leyenda de la órbita YA miran
`prefersReducedMotion` en `script/scripts.js` (líneas 6, 144, 238, 249, 269, 302): no hay que tocarlos.

## Target

«Reducir movimiento» significa menos movimiento y más suave, no cero: se quitan los desplazamientos, escalados y
giros; se mantienen los cambios de opacidad y color que ayudan a entender la página.

```css
/* target: src/styles.css, sustituye el bloque de las líneas 1447-1454 */
/* Accesibilidad: Respetar preferencias de reducción de movimiento */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }

  html {
    scroll-behavior: auto;
  }

  /* Movimiento decorativo infinito: quieto */
  .liquid-bg .blob,
  .animate-pulse,
  .orbit-core,
  .orbit-ring,
  .orbit-item {
    animation: none;
  }

  .platform-pulse {
    animation: none;
    opacity: 0;
  }

  /* Cinta de logos: deja de desplazarse y se muestra centrada, sin la copia duplicada */
  .marquee-track {
    animation: none;
    width: auto;
    flex-wrap: wrap;
    justify-content: center;
  }

  .marquee-track > [aria-hidden="true"] {
    display: none;
  }

  /* Aparición al hacer scroll: solo fundido, sin subir */
  .reveal {
    transform: none;
    transition: opacity 0.3s ease;
  }
}
```

```js
// target: script/scripts.js:92-94
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
});
```

Notas para no romper nada:
- `.orbit-item` usa `transform: translate(var(--tx), var(--ty))` para colocarse en el círculo: al quitar la animación
  cada icono queda en su sitio, quieto. El JS ya deja la leyenda fija en el primer elemento con reducir movimiento.
- La copia de la cinta lleva `aria-hidden="true" tabindex="-1"` (`index.html:158-188`). Ocultarla deja los 4 logos
  una sola vez y siguen siendo enlaces.
- `.reveal` conserva `opacity: 0 → 1`; el JS sigue poniendo el retraso escalonado (máximo 320 ms).

## Repo conventions to follow

- Un único bloque `@media (prefers-reduced-motion: reduce)`, al final de la sección de animaciones
  (`src/styles.css:1447`). Amplíalo; no crees otro.
- En el JS, la variable ya existe: `const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;` (`script/scripts.js:6`).
- CSS fuente en `src/styles.css`, compilado con `npm run build:css`. No edites `css/styles.css` a mano.

## Steps

1. En `src/styles.css`, sustituye las líneas 1447-1454 por el bloque CSS del Target.
2. En `script/scripts.js:93`, cambia `behavior: 'smooth'` por `behavior: prefersReducedMotion ? 'auto' : 'smooth'`.
3. `npm run build:css`; comprueba que `css/styles.css` contiene `.marquee-track>[aria-hidden=true]{display:none}`.

## Boundaries

- NO quites los hovers (subir 2–4 px, cambios de color): son respuesta a una acción del usuario, pequeños y puntuales.
- NO toques el JS de inclinación, parallax ni conteo: ya respetan la preferencia.
- NO cambies nada fuera del bloque `@media` salvo la línea 93 del JS.
- Si el bloque de las líneas 1447-1454 no coincide (el código cambió desde 680ed60), PARA e informa.

## Verification

- **Mecánica**: `npm run build:css` sin errores; `node --check script/scripts.js`.
- **Feel check** con DevTools → Rendering → «Emulate CSS media feature prefers-reduced-motion: reduce», en la
  portada y en `/restaurant/`:
  - El fondo, el punto del chip, la cinta de logos, la órbita y los conectores están quietos.
  - La cinta muestra los 4 logos una sola vez, centrados y en varias filas si no caben, y siguen siendo clicables.
  - Al bajar, las tarjetas aparecen con un fundido, sin subir.
  - Los enlaces del menú y «volver arriba» saltan directamente, sin desplazamiento animado.
  - Con la emulación desactivada, todo se mueve exactamente igual que antes.
- **Done when**: con reducir movimiento no queda ninguna animación infinita ni desplazamiento en ninguna de las 5
  páginas, y sin la preferencia nada cambia.
