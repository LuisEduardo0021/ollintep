# 001 — Añadir la sección «Suite CroHub» a la portada

- **Status**: DONE
- **Commit**: 680ed60
- **Severity**: HIGH (contenido: la web no menciona los productos que se venden hoy)
- **Category**: Contenido (fuera del catálogo de animación; el movimiento reutiliza el existente)
- **Estimated scope**: 4 archivos (`index.html`, `src/styles.css`, `sitemap.xml`, `resources/suite/*.svg` nuevos), ~150 líneas

## Problem

La portada (`index.html`) solo presenta Restaurants, ActaPro, Agro-Cria Pro y Diagmind. No hay ni una mención a la
suite CroHub (9 apps publicadas y el launcher CroHub) ni un enlace a la página de descarga
`https://activation.ollin-tep.com/descargar`. Comprobado con `grep -ciE 'crohub|crovite|croma|cromofi' index.html */index.html` → 0.

Puntos donde falta:

```html
<!-- index.html:74-79 — menú actual -->
<ul class="nav-links">
    <li><a href="#inicio" class="active">INICIO</a></li>
    <li><a href="#servicios">SERVICIOS</a></li>
    <li><a href="#nosotros">NOSOTROS</a></li>
    <li><a href="#contacto">CONTACTO</a></li>
</ul>
```

```html
<!-- index.html:300-301 — fin de la sección de servicios; la nueva sección va justo después -->
        </div>
    </section>
```

```html
<!-- index.html:368-376 — enlaces del pie -->
<ul class="footer-links">
    <li><a href="#servicios">Servicios</a></li>
    ...
    <li><a href="diagmind/index.html">Diagmind</a></li>
</ul>
```

```json
// index.html:37-42 — datos estructurados: makesOffer solo lista los 4 productos antiguos
```

## Target

Una sección nueva `#suite` entre `#servicios` y `#nosotros`, con un encabezado, un botón «Descargar CroHub» y una
tarjeta por app. Datos EXACTOS (de `/home/ollin-tep/crohub/src/datos/apps.json` y del catálogo publicado el
2026-11-04; los nombres se escriben tal cual, incluidos «CroGroove» y «Crogward»):

| id (archivo de logo) | Nombre | Chip (categoría) | Texto | Acento |
| --- | --- | --- | --- | --- |
| crovite-pdf | Crovite PDF | Documentos PDF | Edita, firma, convierte y organiza tus documentos PDF. | #FF8A3D |
| croma-studio | Croma Studio | Fotos y montajes | Edita fotos por capas, ajusta el color, quita fondos con IA, revela tus fotos con preajustes y crea collages para redes. | #FFCF3A |
| cronmy | Cronmy | Fotos y color | Edición de fotos y corrección de color. | #C2EC3E |
| crovect-studio | Crovect Studio | Diseño vectorial | Diseño vectorial, prototipos de interfaz y animación Lottie. | #C77DFF |
| cromofi | Cromofi | Video | Edita video, corrige el color y pon subtítulos automáticos. | #2FD6C4 |
| croudio | Croudio | Audio | Graba, edita y limpia audio. | #FF5562 |
| crobeat | CroBeat | Música | Crea ritmos y produce música. | #8A86FF |
| cromix | CroGroove | Música y DJ | Mezcla música como DJ: 4 platos, efectos, stems, sampler y controladoras. | #22E1F0 |
| croguard | Crogward | VPN | VPN, antivirus y herramientas de red para proteger tu equipo. | #4FC4FF |

No pongas versiones ni sistemas operativos en la web: cambian con cada publicación y quedarían desactualizados. La
página de descarga ya los muestra.

## Repo conventions to follow

- Las tarjetas usan las clases que ya existen: `services-grid` (rejilla), `service-card` (tarjeta, con hover, brillo
  `.card-glow` e inclinación por JS), `m3-chip` (etiqueta), `section-title`, `m3-btn m3-btn-filled` (botón principal).
  Ejemplo a imitar: la tarjeta de Restaurants en `index.html:246-257`.
- `script/scripts.js:113-129` añade solas la aparición al hacer scroll y el escalonado (80 ms entre tarjetas, tope
  320 ms) a todo `.service-card` y `.section-title`: NO añadas JS ni animaciones nuevas.
- El brillo del hover sale de la variable `--service-card-glow` (`src/styles.css:43` y `:497`); se puede fijar por
  tarjeta con `style="--service-card-glow: <acento con alfa 0.18>"`.
- El CSS se edita en `src/styles.css` y se compila con `npm run build:css` a `css/styles.css` (minificado). Nunca
  edites `css/styles.css` a mano.
- Textos en español de México, como el resto del sitio; títulos de sección y de tarjeta en MAYÚSCULAS.

## Steps

1. Copia los 9 logos de la tabla a `resources/suite/` desde `/home/ollin-tep/crohub/src/renderer/logos/<id>.svg`, y
   también `/home/ollin-tep/crohub/src/renderer/logos/crohub.svg`. Son SVG pequeños (≈1 KB cada uno).
2. En `index.html:76`, añade después de SERVICIOS: `<li><a href="#suite">SUITE CROHUB</a></li>`.
3. En `index.html`, justo después de la línea 301 (`</section>` de `#servicios`), inserta:

   ```html
       <!-- Sección Suite CroHub -->
       <section id="suite" class="services max-w-7xl mx-auto px-6 py-20 relative z-10">
           <div class="text-center max-w-2xl mx-auto mb-16">
               <div class="m3-chip mb-3">
                   <img src="resources/suite/crohub.svg" alt="" class="w-4 h-4">
                   <span>CroHub by Ollin-Tep</span>
               </div>
               <h2 class="section-title">SUITE CROHUB</h2>
               <p class="text-slate-400 text-base md:text-lg">Nueve apps de escritorio para documentos, fotos, video, audio, música y seguridad. Se instalan, actualizan y activan desde CroHub.</p>
               <div class="hero-btns justify-center mt-8">
                   <a href="https://activation.ollin-tep.com/descargar" class="m3-btn m3-btn-filled shadow-md">
                       <span>Descargar CroHub</span>
                       <i class="fas fa-download text-xs"></i>
                   </a>
               </div>
           </div>
           <div class="services-grid">
               <!-- una tarjeta por fila de la tabla, en ese orden -->
               <div class="service-card group" style="--service-card-glow: rgba(255, 138, 61, 0.18)">
                   <img src="resources/suite/crovite-pdf.svg" alt="" class="suite-logo" width="52" height="52">
                   <div class="flex items-center gap-2 mb-3">
                       <span class="m3-chip text-[11px] py-0.5 px-2.5">Documentos PDF</span>
                   </div>
                   <h3>CROVITE PDF</h3>
                   <p>Edita, firma, convierte y organiza tus documentos PDF.</p>
                   <div class="card-glow"></div>
               </div>
               <!-- … repite para las otras 8 apps con su logo, chip, nombre en MAYÚSCULAS, texto y acento -->
           </div>
       </section>
   ```

   El acento se convierte a `rgba(r, g, b, 0.18)` (p. ej. `#FFCF3A` → `rgba(255, 207, 58, 0.18)`). El `alt=""` es a
   propósito: el nombre ya está en el `<h3>`.
4. En `src/styles.css`, justo después del bloque `.card-icon` (termina en la línea 518), añade:

   ```css
   .suite-logo {
     width: 52px;
     height: 52px;
     flex-shrink: 0;
     margin-bottom: 1.35rem;
     border-radius: var(--md-sys-shape-corner-large);
   }
   ```
5. En el pie (`index.html:368-376`), añade antes de Restaurants: `<li><a href="#suite">Suite CroHub</a></li>` y
   `<li><a href="https://activation.ollin-tep.com/descargar">Descargar CroHub</a></li>`.
6. En los datos estructurados (`index.html:37-42`), añade al array `makesOffer` una entrada por app con la forma
   `{ "@type": "Offer", "itemOffered": { "@type": "SoftwareApplication", "name": "Crovite PDF", "applicationCategory": "DesktopApplication", "url": "https://activation.ollin-tep.com/descargar" } }`
   y una para «CroHub». Cuida las comas: el JSON tiene que seguir siendo válido.
7. En `sitemap.xml`, cambia el `<lastmod>` de `https://ollin-tep.com/` a la fecha del cambio.
8. Ejecuta `npm install` (si no hay `node_modules`) y `npm run build:css`.

## Boundaries

- NO toques las páginas de producto (`actapro/`, `agrocria/`, `diagmind/`, `restaurant/`) ni sus tarjetas.
- NO añadas animaciones, JS ni dependencias nuevas.
- NO inventes precios, versiones, sistemas operativos ni cifras.
- Si la línea 301 ya no es el cierre de `#servicios` (el código cambió desde 680ed60), PARA e informa.

## Verification

- **Mecánica**: `npm run build:css` termina sin errores; `python3 -c "import json,re;t=open('index.html').read();json.loads(re.search(r'<script type=\"application/ld\+json\">(.*?)</script>',t,re.S).group(1))"` no da error; las 10 imágenes de `resources/suite/` responden 200 al servir el sitio con `python3 -m http.server`.
- **Feel check**: abre la portada servida en local y confirma:
  - SUITE CROHUB aparece en el menú, lleva a la sección y se resalta al llegar.
  - Las 9 tarjetas entran escalonadas al hacer scroll, como las de servicios, y no todas a la vez.
  - El hover de cada tarjeta brilla con el color de su app.
  - A 320 px de ancho los logos no se deforman (siguen cuadrados) y los textos no se salen.
  - «Descargar CroHub» abre `https://activation.ollin-tep.com/descargar`.
- **Done when**: la sección está entre Servicios y Nosotros con las 9 apps de la tabla, hay enlace en el menú y en el
  pie, el JSON-LD es válido y el CSS está recompilado.
