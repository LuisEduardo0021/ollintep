# 006 — Quitar los botones de redes sociales que no llevan a ningún sitio

- **Status**: TODO
- **Commit**: 9346e08
- **Severity**: MEDIUM
- **Category**: Contenido
- **Estimated scope**: 5 HTML, 2–3 líneas cada uno

## Problem

Las 5 páginas tienen botones de Twitter y Facebook que apuntan a `#` (recargan la página arriba del todo), y la portada
además uno de GitHub que lleva a `https://github.com` genérico, no a un perfil. El icono de Twitter es el pájaro
antiguo (`fa-twitter`). Un enlace que no lleva a nada parece una web abandonada.

```html
<!-- index.html:472-476 — actual -->
<div class="social-links">
    <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
    <a href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
    <a href="https://github.com" aria-label="GitHub"><i class="fab fa-github"></i></a>
</div>
```

Mismo bloque (sin GitHub) en `actapro/index.html:380-383`, `agrocria/index.html:349-352`, `diagmind/index.html:342-345`
y `restaurant/index.html:419-422`.

## Target

Hoy no hay perfiles públicos de Ollintep confirmados, así que el bloque `<div class="social-links">…</div>` se elimina
entero en las 5 páginas. Los estilos `.social-links` de `src/styles.css` se dejan (no molestan y sirven cuando haya
perfiles).

Si el dueño da direcciones reales antes de ejecutar este plan, en lugar de borrar, sustituye cada `href` por la
dirección real, usa `fab fa-x-twitter` en vez de `fab fa-twitter` (requiere el plan 007, Font Awesome ≥ 6.4.2), añade
`target="_blank" rel="noopener"` y quita los botones de las redes que no tengan perfil.

## Repo conventions to follow

- HTML con 4 espacios de sangría; no reformatees nada más.

## Steps

1. En las 5 páginas, borra el bloque `<div class="social-links">` completo, desde la línea de apertura hasta su `</div>`.
2. Comprueba: `grep -c "social-links" index.html */index.html` → 0 en todas.

## Boundaries

- NO toques los enlaces de teléfono y correo (`.contact-info-centered`), que están justo encima.
- NO borres las reglas `.social-links` del CSS.
- NO inventes direcciones de perfiles.

## Verification

- **Mecánica**: el `grep` del paso 2 da 0; las páginas siguen siendo HTML válido (el `</div>` que cierra
  `.contact-info` sigue en su sitio).
- **Visual**: en la sección Contacto de cada página quedan el teléfono y el correo, centrados, sin hueco raro debajo.
- **Done when**: no queda ningún botón de red social sin destino real.
