# 005 — Respuesta al pulsar (`:active`) en botones y tarjetas enlace

- **Status**: DONE
- **Commit**: 680ed60
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: `src/styles.css` (~25 líneas nuevas + 8 listas de transición) y 5 HTML (las píldoras de la cinta)
- **Depende de**: 003 (este plan amplía las listas de transición que deja el 003)

## Problem

Ningún elemento pulsable del sitio reacciona al pulsarlo: `grep -n ":active" src/styles.css` solo encuentra
`.nav-links a.active` y `.is-active` (clases de estado, no la pseudoclase). Sin respuesta al pulsar, la interfaz no
parece haber «oído» el clic, sobre todo en el móvil, donde no hay hover.

Elementos pulsables sin `:active` (todas las páginas comparten `src/styles.css`):

| Selector | Dónde se define | Qué es |
| --- | --- | --- |
| `.btn, .m3-btn` | `src/styles.css:372-389` | Botones del hero y de las páginas de producto |
| `.service-card-link` | clase en `index.html:246`, `:260`, `:274`, `:288` (sobre `.service-card`, `src/styles.css:477-490`) | Tarjetas que llevan a cada producto |
| `.back-to-top` | `src/styles.css:784-817` | Botón flotante «volver arriba» |
| `.social-links a` | `src/styles.css:710-729` | Botones redondos de redes |
| `.contact-info-centered li a` | `src/styles.css:684-702` | Teléfono y correo |
| `.product-back-btn` | `src/styles.css:1459-1470` | «← OLLINTEP» en las páginas de producto |
| píldoras de la cinta | clases Tailwind en `index.html:125-182` y en las páginas de producto | Enlaces de la cinta de logos |

## Target

Al pulsar, el elemento se encoge a `0.97` (las tarjetas grandes a `0.98`: en algo grande, 3 % se ve demasiado) en
160 ms, y al soltar vuelve con la transición normal del elemento. Pulsar es rápido y soltar un poco más lento.

Se usa la propiedad individual `scale`, no `transform`, por dos razones:
1. Se suma a la `transform` del hover (`translateY(-2px)`) en lugar de sustituirla, así que el botón no salta hacia abajo.
2. La inclinación 3D de las tarjetas escribe `style.transform` en línea (`script/scripts.js:279-280`), y un estilo en
   línea taparía un `transform` del `:active`; `scale` es otra propiedad y no se pisa.

```css
/* target: añadir al final de la sección de componentes de src/styles.css, justo antes de la línea 1447
   («/* Accesibilidad: Respetar preferencias de reducción de movimiento */») */

/* --- Respuesta al pulsar --- */
.btn:active,
.m3-btn:active,
.back-to-top:active,
.social-links a:active,
.contact-info-centered li a:active,
.product-back-btn:active {
  scale: 0.97;
  transition-duration: 0.16s;
}

.service-card-link:active {
  scale: 0.98;
  transition-duration: 0.16s;
}
```

Hay que añadir `scale` a las listas de transición que deja el plan 003, con la misma duración y curva que el
`transform` de cada una:

| Línea (tras el plan 003) | Selector | Añadir al final de la lista |
| --- | --- | --- |
| 386 | `.btn, .m3-btn` | `, scale 0.2s cubic-bezier(0.2, 0, 0, 1)` |
| 486 | `.service-card, .m3-card` | `, scale 0.28s cubic-bezier(0.2, 0, 0, 1)` |
| 695 | `.contact-info-centered li a` | `, scale 0.2s ease` |
| 722 | `.social-links a` | `, scale 0.2s ease` |
| 801 | `.back-to-top` | `, scale 0.25s cubic-bezier(0.2, 0, 0, 1)` |
| 1463 | `.product-back-btn` | `, scale 0.2s cubic-bezier(0.2, 0, 0, 1)` |

Píldoras de la cinta (HTML): en cada `<a>` de la cinta que tenga `transition-[color,background-color,box-shadow]`
(lo deja así el plan 003), cámbialo a `transition-[color,background-color,box-shadow,scale]` y añade la clase
`active:scale-[0.97]`.

`transition-duration: 0.16s` en el `:active` acorta todas las propiedades solo mientras se mantiene pulsado; al soltar
vuelve la duración normal.

## Repo conventions to follow

- La curva del sitio es `cubic-bezier(0.2, 0, 0, 1)` (salida fuerte); no introduzcas otra.
- CSS fuente en `src/styles.css`, compilado con `npm run build:css` (Tailwind v4 genera `active:scale-[0.97]` y
  `transition-[...,scale]` a partir de las clases del HTML). No edites `css/styles.css` a mano.
- Hovers existentes que se conservan: `.m3-btn-filled:hover` (`translateY(-2px)`, `src/styles.css:400-405`),
  `.service-card:hover` (`translateY(-4px)`, `:492-498`).

## Steps

1. Comprueba que el plan 003 está hecho: `grep -n "transition: all" src/styles.css` no devuelve nada. Si devuelve
   algo, PARA: este plan depende de él.
2. Añade el bloque CSS del Target justo antes del comentario de la línea 1447.
3. Añade `scale …` a las 6 listas de transición de la segunda tabla.
4. En las píldoras de la cinta (`index.html` y las páginas de producto), aplica el cambio de clases del Target.
5. `npm run build:css`; comprueba que `css/styles.css` contiene `scale:.97` y `active\:scale-\[0\.97\]`.

## Boundaries

- NO uses `transform` en los `:active`: rompería la composición con el hover y con la inclinación por JS.
- NO añadas `:active` a los enlaces de texto del menú ni del pie: son texto, no botones.
- NO cambies hovers, colores ni duraciones existentes.
- Si una línea no coincide con lo descrito (el código cambió desde 680ed60 o el 003 no se aplicó), PARA e informa.

## Verification

- **Mecánica**: `npm run build:css` sin errores; los dos `grep` del paso 5 encuentran algo.
- **Feel check**:
  - Mantén pulsado «Explorar Servicios»: se encoge un poco y sigue 2 px arriba (no baja de golpe). Al soltar, vuelve
    suave.
  - Pulsa una tarjeta de producto mientras mueves el ratón: se encoge sin perder la inclinación.
  - En un móvil real (o en DevTools en modo móvil con táctil), tocar un botón da respuesta visible. Si en iPhone no se
    ve, añade al final de `script/scripts.js`, dentro del `DOMContentLoaded`:
    `document.addEventListener('touchstart', () => {}, { passive: true });` (Safari iOS solo activa `:active` si hay
    un listener de `touchstart`).
  - En DevTools → Animations a velocidad 10 %: el encogimiento dura unos 160 ms y la vuelta unos 200 ms.
- **Done when**: los 7 tipos de elemento de la primera tabla responden al pulsar, en escritorio y en el móvil.
