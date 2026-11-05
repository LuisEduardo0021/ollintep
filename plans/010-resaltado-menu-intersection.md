# 010 — Resaltado del menú con `IntersectionObserver` en vez de leer posiciones en cada scroll

- **Status**: DONE
- **Commit**: 9346e08
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: `script/scripts.js`, ~25 líneas

## Problem

```js
// script/scripts.js:56-79 — actual
// --- Resaltado de Sección Activa en Scroll ---
const sections = document.querySelectorAll('section');
const navLi = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        // Detectar qué sección está visible en pantalla
        if (pageYOffset >= (sectionTop - 150)) {
            current = section.getAttribute('id');
        }
    });

    navLi.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href').includes(current)) {
            a.classList.add('active');
        }
    });
});
```

Tres problemas:
1. **Rendimiento:** en cada evento de scroll lee `offsetTop` y `clientHeight` de todas las secciones (obliga a
   calcular la maquetación) y el listener no es pasivo.
2. **Secciones sin `id`:** la cinta de logos es un `<section>` sin `id` (`index.html`, «Sección Logo Marquee»).
   Entre el hero y Servicios, `current` vale `null`, `includes(null)` busca el texto «null» y ningún enlace queda
   activo.
3. **Coincidencias falsas:** `href.includes(current)` compara texto parcial; con `current = ''` todos los enlaces
   coinciden, y además entra en juego el botón «← OLLINTEP» de las páginas de producto (`href="../index.html"`).

## Target

Un `IntersectionObserver` sobre las secciones que tienen `id` y un enlace `#id` en el menú. La sección activa es la
primera (en orden del documento) que cruza una franja entre 150 px por debajo del borde superior (la cabecera fija) y
el 45 % de la altura de la ventana. Si ninguna cruza la franja (p. ej. sobre la cinta de logos), se mantiene la última.

```js
// --- Resaltado de la sección activa en el menú ---
const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const anchorById = new Map(navAnchors.map(a => [a.getAttribute('href').slice(1), a]));
const trackedSections = [...document.querySelectorAll('section[id]')].filter(s => anchorById.has(s.id));

if (trackedSections.length) {
    const inBand = new Set();
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => entry.isIntersecting ? inBand.add(entry.target) : inBand.delete(entry.target));
        const current = trackedSections.find(s => inBand.has(s));
        if (!current) return; // entre secciones: se queda la última activa
        navAnchors.forEach(a => a.classList.toggle('active', a === anchorById.get(current.id)));
    }, { rootMargin: '-150px 0px -55% 0px' });
    trackedSections.forEach(s => sectionObserver.observe(s));
}
```

## Repo conventions to follow

- El archivo agrupa cada función en un bloque con un comentario `// --- Título ---`, 4 espacios de sangría, dentro del
  `DOMContentLoaded`. Ejemplo: el bloque de aparición con `IntersectionObserver` (`script/scripts.js:112-140`).

## Steps

1. Sustituye las líneas 56-79 de `script/scripts.js` (desde el comentario `// --- Resaltado de Sección Activa en Scroll ---`
   hasta el `});` que cierra ese `addEventListener`) por el bloque del Target.
2. `node --check script/scripts.js`.

## Boundaries

- NO cambies el marcado del menú ni la clase `active` del CSS (`.nav-links a.active`, `src/styles.css`).
- NO toques los otros listeners de scroll (botón «volver arriba», barra de progreso, parallax).
- Si las líneas 56-79 no coinciden con el extracto, PARA e informa.

## Verification

- **Mecánica**: `node --check script/scripts.js`; `grep -n "offsetTop\|pageYOffset" script/scripts.js` → nada.
- **Feel check** en la portada (escritorio y móvil con el menú abierto):
  - Arriba del todo está activo INICIO.
  - Al bajar por la cinta de logos sigue activo INICIO (antes se apagaban todos).
  - SERVICIOS, SUITE CROHUB, NOSOTROS y CONTACTO se activan al llegar a cada sección, uno solo cada vez.
  - Al pulsar un enlace del menú, al terminar el desplazamiento queda activo ese.
  - En una página de producto (`/actapro/`), el botón «← OLLINTEP» nunca se marca como activo.
  - DevTools → Performance, grabando un scroll: ya no aparece «Layout» forzado desde este listener.
- **Done when**: el resaltado es correcto en las 5 páginas y no queda lectura de posiciones en scroll.
