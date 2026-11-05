# 008 — `favicon.ico` y página 404 propia

- **Status**: DONE
- **Commit**: 9346e08
- **Severity**: LOW
- **Category**: Contenido
- **Estimated scope**: 2 archivos nuevos en la raíz (`favicon.ico`, `404.html`)

## Problem

- `https://ollin-tep.com/favicon.ico` da 404. Las páginas declaran un icono SVG (`<link rel="icon" type="image/svg+xml"
  href="resources/ollintep.svg">`, `index.html:57`), pero muchos navegadores, lectores de RSS, buscadores y
  marcadores piden `/favicon.ico` directamente.
- `https://ollin-tep.com/404.html` no existe, así que una dirección mal escrita muestra la página 404 genérica de
  GitHub Pages, sin marca ni forma de volver.

## Target

1. `favicon.ico` en la raíz, generado desde `resources/ollintep.svg` (logo de Ollintep, 236×225), con tamaños 16, 32 y
   48 px.
2. `404.html` en la raíz. GitHub Pages la sirve sola para cualquier dirección que no existe. Como se sirve en
   cualquier ruta (p. ej. `/actapro/nada/`), **todas sus rutas son absolutas** (`/css/…`, `/resources/…`).

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Página no encontrada · Ollintep Software</title>
    <link rel="icon" type="image/svg+xml" href="/resources/ollintep.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/styles.css?v=2.2">
</head>
<body>
    <div class="liquid-bg" aria-hidden="true">
        <span class="blob blob-1"></span>
        <span class="blob blob-2"></span>
        <span class="blob blob-3"></span>
    </div>
    <section class="hero">
        <div class="hero-content">
            <img src="/resources/ollintep.svg" alt="Ollintep Software" width="72" height="69" class="mb-6">
            <h1>ESTA PÁGINA NO EXISTE</h1>
            <p>Puede que el enlace esté mal escrito o que la página se haya movido.</p>
            <div class="hero-btns">
                <a href="/" class="m3-btn m3-btn-filled shadow-md"><span>Ir al inicio</span></a>
                <a href="https://activation.ollin-tep.com/descargar" class="m3-btn m3-btn-tonal"><span>Descargar CroHub</span></a>
            </div>
        </div>
    </section>
</body>
</html>
```

La versión `?v=2.2` del CSS tiene que coincidir con la que usan las demás páginas en el momento de ejecutar el plan
(`grep -o 'styles.css?v=[0-9.]*' index.html`).

## Steps

1. Busca una herramienta para convertir el SVG: `command -v magick convert rsvg-convert inkscape`.
   - Con ImageMagick 7: `magick -background none resources/ollintep.svg -define icon:auto-resize=48,32,16 favicon.ico`
   - Con ImageMagick 6: `convert -background none resources/ollintep.svg -define icon:auto-resize=48,32,16 favicon.ico`
   - Si no hay ninguna: PARA e informa (no instales nada sin permiso).
2. Comprueba: `file favicon.ico` dice «MS Windows icon resource» con 3 iconos.
3. Crea `404.html` con el contenido del Target.
4. `npm run build:css` (Tailwind lee `../*.html`, así recoge las clases de la página nueva, p. ej. `mb-6`).

## Boundaries

- NO cambies los `<link rel="icon">` de las páginas existentes: el SVG sigue siendo el icono principal.
- NO añadas `404.html` al `sitemap.xml`.
- La página 404 no carga `script/scripts.js`: no lo necesita.

## Verification

- **Mecánica**: `file favicon.ico`; `npm run build:css` sin errores.
- **Local**: `python3 -m http.server 8765` y abre `http://127.0.0.1:8765/404.html`: se ve el logo, el título, el texto
  y los dos botones con el estilo del sitio y el fondo oscuro con las manchas de luz.
- **Tras publicar**: `curl -s -o /dev/null -w '%{http_code}' https://ollin-tep.com/favicon.ico` → 200; abrir
  `https://ollin-tep.com/no-existe/` muestra la página propia (código 404) con estilos.
- **Done when**: las dos direcciones responden como se describe.
