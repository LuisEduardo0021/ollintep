# Planes de mejora de ollin-tep.com

Auditoría del 2026-11-04 (commit 680ed60) con las skills `improve-animations` y `emil-design-eng`. Cada plan es
autónomo: lo puede ejecutar cualquier agente sin el contexto de la auditoría.

| # | Plan | Gravedad | Estado |
| --- | --- | --- | --- |
| 001 | [Añadir la sección «Suite CroHub» a la portada](001-seccion-suite-crohub.md) | HIGH | DONE |
| 002 | [La barra de progreso anima `transform`, no `width`](002-barra-progreso-transform.md) | HIGH | DONE |
| 003 | [Sustituir `transition: all` por las propiedades exactas](003-quitar-transition-all.md) | HIGH | DONE |
| 004 | [Respetar «reducir movimiento» en todo el sitio](004-reducir-movimiento-completo.md) | MEDIUM | DONE |
| 005 | [Respuesta al pulsar (`:active`)](005-respuesta-al-pulsar.md) | MEDIUM | DONE |
| 006 | [Quitar los botones de redes sin destino](006-redes-sociales.md) | MEDIUM | DONE |
| 007 | [Font Awesome 6.0.0 → 6.7.2](007-font-awesome.md) | LOW | DONE |
| 008 | [`favicon.ico` y página 404 propia](008-favicon-y-404.md) | LOW | DONE |
| 009 | [Enlaces a los textos legales](009-enlaces-legales.md) | MEDIUM | BLOCKED (no hay textos publicados) |
| 010 | [Resaltado del menú con `IntersectionObserver`](010-resaltado-menu-intersection.md) | MEDIUM | DONE |
| 011 | [Menú móvil: una sola animación con `transform`](011-menu-movil-transform.md) | MEDIUM | DONE |
| 012 | [Hovers sin movimiento en táctil e inclinación suavizada](012-hover-tactil-e-inclinacion.md) | MEDIUM | DONE |
| 013 | [Fondo líquido sin `blur(100px)` y con seguimiento suave](013-fondo-liquido.md) | LOW | DONE |

## Orden recomendado

1. **003** primero: toca muchas líneas de `src/styles.css`, y el 005 se apoya en sus listas de transición.
2. **002** y **004**: independientes entre sí y del resto; cualquier orden.
3. **005** después del 003 (dependencia obligatoria: amplía las listas que deja el 003).
4. **001** al final: la sección nueva usa `.service-card`, así que hereda automáticamente las mejoras del 003, 004 y
   005. También se puede hacer el primero si corre prisa el contenido; no hay conflicto de líneas, solo cambiarían los
   números de línea de `index.html` para los otros planes.

Tras cada plan: `npm run build:css` (el CSS servido es `css/styles.css`, compilado desde `src/styles.css`).

## Segunda tanda (006-013), orden recomendado

1. **007** antes del **006** solo si el 006 va a usar perfiles reales (`fa-x-twitter` necesita 6.4.2 o más); si el 006
   solo borra los botones, da igual el orden.
2. **010**, **011**, **012** y **013** tocan `script/scripts.js` en zonas distintas; hazlos de uno en uno y en ese orden
   para que los números de línea de cada plan sigan valiendo (cada uno cita líneas de 9346e08: búscalas por su
   comentario si se movieron).
3. **008** en cualquier momento (archivos nuevos).
4. **009** está bloqueado hasta que `https://activation.ollin-tep.com/legal` tenga textos publicados.

## Fuera de los planes

- Cifras de la sección «Nosotros» (+8 años, +40 proyectos, +15 clientes, 98 % de satisfacción): las tiene que confirmar
  el dueño; no hay plan porque no se pueden verificar desde el código.
