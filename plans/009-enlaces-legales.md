# 009 — Enlaces a los textos legales en el pie

- **Status**: BLOCKED — hasta que haya textos publicados en `https://activation.ollin-tep.com/legal`
- **Commit**: 9346e08
- **Severity**: MEDIUM
- **Category**: Contenido / legal
- **Estimated scope**: 5 HTML, 1 línea cada uno

## Problem

La web enlaza a la descarga de CroHub, que vende licencias, pero ninguna página enlaza a términos de uso ni a aviso de
privacidad. El servidor de CroHub tiene la página `https://activation.ollin-tep.com/legal` (índice) y
`/legal/<doc>` (cada texto), pero el 2026-11-04 el índice decía **«Todavía no hay textos publicados.»**
(comprobado con `curl -s https://activation.ollin-tep.com/legal | grep -o 'Todavía no hay textos publicados'`).

Enlazar ahora llevaría a una página vacía. Primero hay que publicar los textos (desde el repositorio de CroHub,
`server/`), y eso lo decide el dueño.

## Target

Cuando el índice tenga textos, un enlace «Textos legales» como último elemento de la lista del pie de las 5 páginas:

```html
<li><a href="https://activation.ollin-tep.com/legal">Textos legales</a></li>
```

Ubicación: dentro de `<ul class="footer-links">`, justo antes de su `</ul>`: `index.html:488-499`,
`actapro/index.html:395-…`, `agrocria/index.html:364-…`, `diagmind/index.html:357-…`, `restaurant/index.html:434-…`.

Se enlaza el índice y no cada documento para no tener que tocar la web cada vez que se publica una versión nueva de
un texto.

## Steps

1. Comprueba la condición: `curl -s https://activation.ollin-tep.com/legal | grep -c 'class="textos"'` → 1 o más. Si da
   0, PARA: el plan sigue bloqueado.
2. Añade la línea del Target al final de cada `footer-links`.
3. Comprueba: `grep -c 'activation.ollin-tep.com/legal' index.html */index.html` → 1 en cada una.

## Boundaries

- NO redactes ni publiques textos legales desde este repositorio.
- NO enlaces si el índice sigue vacío.

## Verification

- **Mecánica**: los `grep` de los pasos 1 y 3.
- **Visual**: el enlace aparece en el pie de las 5 páginas, con el mismo estilo que los demás, y abre el índice con los
  textos.
- **Done when**: las 5 páginas enlazan a un índice legal con contenido.
