# 013 — Fondo líquido: sin `blur(100px)` y siguiendo al ratón con suavizado

- **Status**: TODO
- **Commit**: 9346e08
- **Severity**: LOW
- **Category**: Performance / Cohesion
- **Estimated scope**: `src/styles.css` (~10 líneas), `script/scripts.js` (~15 líneas)

## Problem

**1. Desenfoque caro.** Las tres manchas de luz del fondo, presentes en las 5 páginas, llevan `filter: blur(100px)` y
una animación infinita de escala y traslación. Un desenfoque de 100 px sobre elementos de 480-600 px es caro de pintar,
sobre todo en Safari y en portátiles modestos; la regla del sitio es mantener los desenfoques por debajo de 20 px. Y no
hace falta: las manchas ya son un degradado radial que se desvanece hasta transparente.

```css
/* src/styles.css:98-131 — actual (extracto) */
.liquid-bg .blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.65;
  will-change: transform;
}

.liquid-bg .blob-1 {
  width: 550px;
  height: 550px;
  ...
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
  animation: m3-pulse 16s ease-in-out infinite alternate;
}
/* .blob-2: rgba(129, 140, 248, 0.12), 600 px · .blob-3: rgba(52, 211, 153, 0.1), 480 px */
```

**2. Seguimiento del ratón sin suavizado.** El fondo se desplaza de golpe a la posición del ratón en cada `mousemove`:
se nota mecánico.

```js
// script/scripts.js:287-295 — actual
// El fondo líquido reacciona sutilmente al movimiento del cursor
const liquidBg = document.querySelector('.liquid-bg');
if (liquidBg) {
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 40;
        const y = (e.clientY / window.innerHeight - 0.5) * 40;
        liquidBg.style.transform = `translate(${x}px, ${y}px)`;
    });
}
```

## Target

**1.** Sin `filter`. Para conservar el borde difuso, el degradado se suaviza con un paso intermedio y se agranda un
poco la mancha (lo que hacía el desenfoque):

```css
.liquid-bg .blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.65;
  will-change: transform;
}

/* .blob-1 */
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.06) 35%, transparent 70%);
/* .blob-2 */
  width: 760px;
  height: 760px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.12) 0%, rgba(129, 140, 248, 0.05) 35%, transparent 70%);
/* .blob-3 */
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, rgba(52, 211, 153, 0.04) 35%, transparent 70%);
```

Las posiciones (`top`, `left`, `right`, `bottom`) y las animaciones `m3-pulse` no cambian.

**2.** El fondo se acerca a la posición del ratón poco a poco, fotograma a fotograma, y deja de calcular cuando llega:

```js
// target: sustituye script/scripts.js:287-295
// El fondo líquido sigue al cursor con retraso suave (interpolado por fotograma; directo se nota mecánico)
const liquidBg = document.querySelector('.liquid-bg');
if (liquidBg) {
    let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
    const follow = () => {
        x += (tx - x) * 0.08;
        y += (ty - y) * 0.08;
        liquidBg.style.transform = `translate(${x}px, ${y}px)`;
        frame = Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1 ? 0 : requestAnimationFrame(follow);
    };
    window.addEventListener('mousemove', (e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 40;
        ty = (e.clientY / window.innerHeight - 0.5) * 40;
        if (!frame) frame = requestAnimationFrame(follow);
    }, { passive: true });
}
```

## Repo conventions to follow

- Mismo estilo que el plan 012 (interpolación por fotograma con `requestAnimationFrame`).
- El bloque está dentro de `if (canHover)` y `if (!prefersReducedMotion)`: sigue igual.
- `npm run build:css` tras tocar `src/styles.css`.

## Steps

1. Haz una captura de la portada arriba del todo (1280×800) ANTES del cambio, para comparar.
2. En `src/styles.css`, quita `filter: blur(100px);` de `.liquid-bg .blob` y cambia tamaño y degradado de
   `.blob-1/2/3` según el Target.
3. Sustituye el bloque JS de las líneas 287-295.
4. `node --check script/scripts.js` y `npm run build:css`.
5. Captura de nuevo y compara.

## Boundaries

- NO cambies colores base, posiciones ni las animaciones `m3-pulse`.
- NO toques `prefers-reduced-motion` (las manchas ya se paran ahí, plan 004).
- Si la comparación muestra manchas con borde duro o mucho más brillantes, ajusta SOLO el paso intermedio del degradado
  (35 % y su alfa) y explica el valor final en el informe.

## Verification

- **Mecánica**: `grep -n "blur(100px)" src/styles.css` → nada; `node --check script/scripts.js`.
- **Visual**: las capturas antes/después se parecen: manchas de luz suaves y difusas, sin borde visible.
- **Feel check**: al mover el ratón, el fondo se desplaza con un retraso suave y se para poco después de parar el ratón.
- **Rendimiento**: DevTools → Rendering → «Paint flashing»: las manchas no destellan en cada fotograma; Performance:
  sin tareas largas de «Paint» por las manchas.
- **Done when**: no queda `blur(100px)` y el fondo se ve igual de difuso.
