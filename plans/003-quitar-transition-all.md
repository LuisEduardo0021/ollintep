# 003 — Sustituir `transition: all` por las propiedades exactas

- **Status**: DONE
- **Commit**: 680ed60
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: `src/styles.css` (15 reglas) + 5 HTML (17 clases `transition-all`), ~35 líneas

## Problem

Casi todos los elementos interactivos usan `transition: all`. Así se anima cualquier propiedad que cambie (también
`padding`, `width` o `visibility`) y el navegador tiene que vigilarlas todas. Hoy obliga a maquetar en la cabecera y,
en cuanto alguien cambie un `padding` en un hover, lo animará sin querer. En el HTML pasa lo mismo con la clase
`transition-all` de Tailwind.

Reglas afectadas en `src/styles.css` (línea → regla actual):

| Línea | Selector | Actual |
| --- | --- | --- |
| 61 | `:root` (variable `--transition`) | `--transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);` (no se usa en ningún sitio) |
| 160 | `.header` | `transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);` |
| 180 | `.navbar` | `transition: all 0.3s ease;` |
| 234 | `.nav-links a` | `transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);` |
| 261 | `.menu-toggle .bar` | `transition: all 0.25s ease;` |
| 386 | `.btn, .m3-btn` | `transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);` |
| 447 | `.m3-chip` | `transition: all 0.2s ease;` (no tiene hover ni estados) |
| 486 | `.service-card, .m3-card` | `transition: all 0.28s cubic-bezier(0.2, 0, 0, 1);` |
| 625 | `.stat` | `transition: all 0.25s ease;` |
| 695 | `.contact-info-centered li a` | `transition: all 0.2s ease;` |
| 722 | `.social-links a` | `transition: all 0.2s ease;` |
| 801 | `.back-to-top` | `transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);` |
| 834 | `.plan-card` | `transition: all 0.25s ease;` |
| 935 | `.video-card` | `transition: all 0.25s ease;` |
| 1075 | `.orbit-item` | `transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);` |
| 1157 | `.orbit-list li` | `transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);` |
| 1463 | `.product-back-btn` | `transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);` |

En el HTML, `transition-all` aparece 8 veces en `index.html` (las 8 píldoras de la cinta de logos, líneas 125-182),
3 en `actapro/index.html` y 2 en cada una de `agrocria/`, `diagmind/` y `restaurant/`.

## Target

Cada regla anima solo lo que cambia de verdad en sus estados (`:hover`, `.is-scrolled`, `.visible`, `.is-active`),
con la MISMA duración y curva que tiene ahora. La curva del sitio es `cubic-bezier(0.2, 0, 0, 1)`, una salida fuerte;
se mantiene donde ya está y no se cambia `ease` por otra cosa en este plan.

| Línea | Selector | Nuevo valor |
| --- | --- | --- |
| 61 | `:root` | borrar la línea `--transition: …` |
| 160 | `.header` | `transition: padding 0.3s cubic-bezier(0.2, 0, 0, 1);` |
| 180 | `.navbar` | `transition: background-color 0.3s ease, box-shadow 0.3s ease;` |
| 234 | `.nav-links a` | `transition: color 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s cubic-bezier(0.2, 0, 0, 1);` |
| 261 | `.menu-toggle .bar` | `transition: transform 0.25s ease, opacity 0.25s ease;` |
| 386 | `.btn, .m3-btn` | `transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);` |
| 447 | `.m3-chip` | borrar la línea `transition` (no tiene nada que animar) |
| 486 | `.service-card, .m3-card` | `transition: transform 0.28s cubic-bezier(0.2, 0, 0, 1), background-color 0.28s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.28s cubic-bezier(0.2, 0, 0, 1);` |
| 625 | `.stat` | `transition: transform 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease;` |
| 695 | `.contact-info-centered li a` | `transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;` |
| 722 | `.social-links a` | `transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;` |
| 801 | `.back-to-top` | `transition: opacity 0.25s cubic-bezier(0.2, 0, 0, 1), visibility 0.25s cubic-bezier(0.2, 0, 0, 1), transform 0.25s cubic-bezier(0.2, 0, 0, 1), background-color 0.25s cubic-bezier(0.2, 0, 0, 1), color 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s cubic-bezier(0.2, 0, 0, 1);` |
| 834 | `.plan-card` | `transition: transform 0.25s ease, box-shadow 0.25s ease;` |
| 935 | `.video-card` | `transition: transform 0.25s ease, box-shadow 0.25s ease;` |
| 1075 | `.orbit-item` | `transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s cubic-bezier(0.2, 0, 0, 1), color 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);` |
| 1157 | `.orbit-list li` | `transition: background-color 0.25s cubic-bezier(0.2, 0, 0, 1), color 0.25s cubic-bezier(0.2, 0, 0, 1);` |
| 1463 | `.product-back-btn` | `transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.2s cubic-bezier(0.2, 0, 0, 1);` |

En los HTML, cada clase `transition-all` pasa a `transition-[color,background-color,box-shadow]`: es lo único que
cambia en el hover de esas píldoras (`hover:bg-slate-800 hover:text-white hover:shadow-md`). Su logo ya tiene su
propia `transition-transform`.

Por qué `background-color` y no `background`: los hovers de los botones de tema usan un degradado
(`linear-gradient(...)`), y un degradado no se puede interpolar ni con `all`. El cambio se ve igual que ahora: salto
instantáneo en el degradado y transición suave en los colores lisos.

## Repo conventions to follow

- El CSS fuente es `src/styles.css`, compilado con `npm run build:css` a `css/styles.css` (Tailwind v4, que genera
  `transition-[...]` a partir de las clases del HTML). No edites `css/styles.css` a mano.
- Mantén el formato del archivo: una declaración por línea, dos espacios de sangría.

## Steps

1. En `src/styles.css`, aplica cada fila de la tabla Target en su línea. Antes de cambiar cada una, comprueba que la
   línea actual coincide con la tabla Problem.
2. Comprueba que no queda ninguno: `grep -n "transition: all\|--transition:" src/styles.css` no devuelve nada.
3. En `index.html`, `actapro/index.html`, `agrocria/index.html`, `diagmind/index.html` y `restaurant/index.html`,
   sustituye cada ` transition-all ` por ` transition-[color,background-color,box-shadow] `. Comprueba con
   `grep -c "transition-all" index.html */index.html`: debe dar 0 en todos.
4. `npm run build:css`, y comprueba que `css/styles.css` contiene `transition-property:color,background-color,box-shadow`.

## Boundaries

- NO cambies duraciones ni curvas, solo la lista de propiedades.
- NO toques la animación de `.nav-links` (`transition: right …`, línea 303) ni la de `.reveal`: tienen sus propias
  propiedades y no son `all`.
- NO cambies el JS de la inclinación de las tarjetas (`script/scripts.js:271-285`), aunque escriba `style.transform`.
- Si alguna línea no coincide con la tabla Problem (el código cambió desde 680ed60), PARA e informa.

## Verification

- **Mecánica**: los dos `grep` de los pasos 2 y 3 dan 0; `npm run build:css` sin errores.
- **Feel check**: en la portada y en `/restaurant/`, comprueba que todo se sigue animando igual que antes:
  - hover de botones (sube 2 px y cambia de color), tarjetas de servicio (suben 4 px y brillan), cifras, enlaces de
    contacto y redes;
  - la cabecera se compacta al bajar más de 10 px y la barra se oscurece;
  - el botón de volver arriba aparece y desaparece con fundido;
  - las tres rayas del menú móvil se convierten en una X.
  - En DevTools → Animations, a velocidad 10 %, ningún elemento anima una propiedad que no esté en su lista.
- **Done when**: no queda `transition: all` ni `transition-all` en el código fuente y el aspecto es el mismo.
