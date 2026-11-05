# Planes de mejora de ollin-tep.com

Auditoría del 2026-11-04 (commit 680ed60) con las skills `improve-animations` y `emil-design-eng`. Cada plan es
autónomo: lo puede ejecutar cualquier agente sin el contexto de la auditoría.

| # | Plan | Gravedad | Estado |
| --- | --- | --- | --- |
| 001 | [Añadir la sección «Suite CroHub» a la portada](001-seccion-suite-crohub.md) | HIGH | TODO |
| 002 | [La barra de progreso anima `transform`, no `width`](002-barra-progreso-transform.md) | HIGH | TODO |
| 003 | [Sustituir `transition: all` por las propiedades exactas](003-quitar-transition-all.md) | HIGH | TODO |
| 004 | [Respetar «reducir movimiento» en todo el sitio](004-reducir-movimiento-completo.md) | MEDIUM | TODO |
| 005 | [Respuesta al pulsar (`:active`)](005-respuesta-al-pulsar.md) | MEDIUM | TODO |

## Orden recomendado

1. **003** primero: toca muchas líneas de `src/styles.css`, y el 005 se apoya en sus listas de transición.
2. **002** y **004**: independientes entre sí y del resto; cualquier orden.
3. **005** después del 003 (dependencia obligatoria: amplía las listas que deja el 003).
4. **001** al final: la sección nueva usa `.service-card`, así que hereda automáticamente las mejoras del 003, 004 y
   005. También se puede hacer el primero si corre prisa el contenido; no hay conflicto de líneas, solo cambiarían los
   números de línea de `index.html` para los otros planes.

Tras cada plan: `npm run build:css` (el CSS servido es `css/styles.css`, compilado desde `src/styles.css`).

## Fuera de estos planes (hallazgos de la auditoría sin plan todavía)

- Contenido: redes Twitter/Facebook en `#`; Font Awesome 6.0.0; `favicon.ico` 404 y sin página 404; sin enlaces a la
  parte legal (`https://activation.ollin-tep.com/legal`); cifras de «Nosotros» por revisar.
- Movimiento: el resaltado del menú lee `offsetTop` en cada scroll (`script/scripts.js:60-79`); la cabecera anima
  `padding` y el menú móvil anima `right` además de su View Transition; la inclinación de tarjetas va con retraso por la
  transición de `transform` y su hover no está limitado a ratón; `blur(100px)` en las manchas del fondo; el fondo
  sigue al ratón sin suavizado.
