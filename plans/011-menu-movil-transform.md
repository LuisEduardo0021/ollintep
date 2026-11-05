# 011 — Menú móvil: una sola animación, con `transform`

- **Status**: TODO
- **Commit**: 9346e08
- **Severity**: MEDIUM
- **Category**: Performance / Interruptibility
- **Estimated scope**: `src/styles.css` (~20 líneas), `script/scripts.js` (~30 líneas menos)

## Problem

El panel del menú móvil se anima dos veces a la vez:

```css
/* src/styles.css:288-310 — dentro de @media (max-width: 868px) — actual */
.nav-links {
  position: fixed;
  top: 0;
  right: -100%;
  ...
  transition: right 0.35s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: -15px 0 40px rgba(0, 0, 0, 0.5);
}

.nav-links.active {
  right: 0;
}
```

```js
// script/scripts.js:21-33 — actual (y lo mismo en 36-53 al pulsar un enlace)
mobileMenu.addEventListener('click', () => {
    if (document.startViewTransition && !prefersReducedMotion) {
        navLinks.classList.add('vt-nav');
        const transition = document.startViewTransition(() => {
            toggleMobileMenu();
        });
        transition.finished.finally(() => {
            navLinks.classList.remove('vt-nav');
        });
    } else {
        toggleMobileMenu();
    }
});
```

1. Anima `right`, una propiedad de maquetación: cada fotograma recalcula la maquetación del panel.
2. Encima, cada apertura o cierre pasa por una View Transition (`vt-nav`, con su fundido de 0,25 s definido en
   `src/styles.css:1449-1458`), que congela la página en capturas mientras dura. Las dos animaciones se pisan.
3. La View Transition no se puede interrumpir: si se pulsa la hamburguesa dos veces rápido, la segunda espera.
4. Cerrado, el panel sigue ahí a la derecha y sus enlaces reciben el foco con el tabulador aunque no se vean.

## Target

Una sola transición CSS de `transform` (la GPU la compone sin maquetar), interrumpible, y el panel oculto de verdad
(`visibility: hidden`) cuando está cerrado:

```css
/* target: sustituye los dos bloques de src/styles.css:288-310, dentro del mismo @media (max-width: 868px) */
.nav-links {
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 340px;
  height: 100vh;
  background: rgba(16, 23, 38, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: none;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 3rem 2rem;
  gap: 1.25rem;
  box-shadow: -15px 0 40px rgba(0, 0, 0, 0.5);
  transform: translateX(calc(100% + 40px)); /* + la sombra, para que no asome */
  visibility: hidden;
  transition: transform 0.35s cubic-bezier(0.2, 0, 0, 1), visibility 0s linear 0.35s;
}

.nav-links.active {
  transform: translateX(0);
  visibility: visible;
  transition: transform 0.35s cubic-bezier(0.2, 0, 0, 1), visibility 0s linear 0s;
}
```

La `visibility` cambia al instante al abrir y al terminar el deslizamiento al cerrar (por el retraso de 0.35s).

```js
// target: script/scripts.js — sustituye los dos listeners (líneas 21-53) por:
mobileMenu.addEventListener('click', () => toggleMobileMenu());

// Cerrar menú al hacer clic en un enlace (móvil)
document.querySelectorAll('.nav-links a').forEach(item => {
    item.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) toggleMobileMenu(true);
    });
});
```

Y en el bloque `@media (prefers-reduced-motion: reduce)` de `src/styles.css` añade:

```css
  .nav-links,
  .nav-links.active {
    transition: none;
  }
```

Por último, borra el bloque que ya no se usa (`src/styles.css:1449-1458`):

```css
/* Transición específica para menú móvil in-page */
.nav-links.vt-nav {
  view-transition-name: mobile-navigation;
}

::view-transition-old(mobile-navigation),
::view-transition-new(mobile-navigation) {
  animation-duration: 0.25s;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
```

## Repo conventions to follow

- La curva del sitio es `cubic-bezier(0.2, 0, 0, 1)`; 0.35 s está dentro del margen para cajones (200–500 ms).
- `toggleMobileMenu(forceClose)` (`script/scripts.js:9-19`) se conserva tal cual: ya cambia `active`,
  `is-active` y `aria-expanded`.
- La variable `prefersReducedMotion` (línea 6) se sigue usando en otros bloques: no la borres.

## Steps

1. Sustituye los bloques CSS del menú (líneas 288-310) por el Target, sin salir del `@media (max-width: 868px)`.
2. Sustituye los listeners de las líneas 21-53 del JS por el Target.
3. Añade la regla al bloque `prefers-reduced-motion`.
4. Borra el bloque `.nav-links.vt-nav` y sus `::view-transition-*(mobile-navigation)`.
5. Comprueba: `grep -n "vt-nav\|mobile-navigation\|right: -100%" src/styles.css script/scripts.js` → nada.
6. `node --check script/scripts.js` y `npm run build:css`.

## Boundaries

- NO toques las View Transitions entre páginas (`@view-transition`, `app-header`, `card-*`): son otra cosa.
- NO cambies la cabecera (`.header`). Su `padding` animado al hacer scroll se queda: ocurre una vez al cruzar los 10 px
  y pasarlo a `transform` convertiría `.header` en el bloque contenedor del panel `position: fixed` y lo descolocaría.
- Si los extractos no coinciden con el código, PARA e informa.

## Verification

- **Mecánica**: los comandos de los pasos 5 y 6.
- **Feel check** con DevTools en modo móvil (375 px):
  - La hamburguesa abre el panel deslizándose desde la derecha y lo cierra igual; las rayas se convierten en X.
  - Pulsar la hamburguesa dos veces muy rápido invierte el movimiento desde donde va, sin saltos ni esperas.
  - Pulsar un enlace del menú cierra el panel y lleva a la sección.
  - Con el panel cerrado, el tabulador no pasa por sus enlaces; abierto, sí.
  - Con la sombra del panel cerrado no asoma nada por el borde derecho.
  - Con «reducir movimiento» emulado, abre y cierra sin deslizarse.
  - En escritorio (más de 868 px) el menú sigue en línea, sin cambios.
- **Done when**: una sola animación de `transform`, interrumpible, y sin rastro de `vt-nav`.
