# 007 — Actualizar Font Awesome de 6.0.0 a 6.7.2

- **Status**: DONE
- **Commit**: 9346e08
- **Severity**: LOW
- **Category**: Contenido / dependencias
- **Estimated scope**: 5 HTML, 1 línea cada uno

## Problem

Las 5 páginas cargan Font Awesome 6.0.0, de febrero de 2022:

```html
<!-- index.html:65, actapro/index.html:86, agrocria/index.html:52, diagmind/index.html:52, restaurant/index.html:77 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
```

No tiene iconos nuevos como `fa-x-twitter` (desde 6.4.2) y arrastra arreglos que ya salieron.

## Target

La última 6.x publicada en cdnjs, comprobada el 2026-11-04 con
`curl -s "https://api.cdnjs.com/libraries/font-awesome?fields=versions"`: **6.7.2**.

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
```

No se sube a la 7.x (7.3.1 en cdnjs): cambia el ancho por defecto de los iconos y los estilos, y habría que revisar todo
el sitio. Dentro de la 6.x los nombres de clase usados aquí no cambian.

Iconos que usa el sitio (todos existen en 6.7.2): `fa-check fa-phone fa-envelope fa-arrow-up fa-arrow-down fa-arrow-right
fa-arrow-left fa-microchip fa-calendar-check fa-brain fa-utensils fa-shield-halved fa-seedling fa-mobile-screen-button
fa-file-signature fa-desktop fa-wifi fa-wheat-awn fa-user-shield fa-tablet-screen-button fa-screwdriver-wrench fa-rocket
fa-receipt fa-qrcode fa-paper-plane fa-motorcycle fa-list-check fa-laptop-code fa-droplet fa-download fa-cubes
fa-credit-card fa-cow fa-comments fa-cloud fa-chart-pie fa-chart-line fa-cash-register fa-bell fa-battery-half` y las
marcas `fa-windows fa-usb fa-linux fa-github fa-apple fa-android fa-twitter fa-facebook`.

## Steps

1. En las 5 páginas: `sed -i 's#font-awesome/6.0.0/css/all.min.css#font-awesome/6.7.2/css/all.min.css#' index.html */index.html`.
2. Comprueba: `grep -c "font-awesome/6.7.2" index.html */index.html` → 1 en cada una; `grep -c "6.0.0" index.html */index.html` → 0.
3. Comprueba que el archivo existe: `curl -s -o /dev/null -w '%{http_code}' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css` → 200.

## Boundaries

- NO subas a 7.x.
- NO cambies clases de iconos (el cambio de `fa-twitter` a `fa-x-twitter` es del plan 006, y solo si hay perfil real).

## Verification

- **Mecánica**: los `grep` y el `curl` de los pasos 2 y 3.
- **Visual**: abre las 5 páginas y recorre las secciones: ningún icono sale como un cuadrado vacío ni cambia de tamaño
  (botones del hero, tarjetas, contacto, «volver arriba», plataformas de Diagmind con `fa-windows`/`fa-linux`/`fa-android`).
- **Done when**: las 5 páginas cargan 6.7.2 y todos los iconos se ven.
