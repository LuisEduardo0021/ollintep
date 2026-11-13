#!/usr/bin/env python3
"""Genera las fichas de las apps de la suite: apps/<app>/index.html (español) y en/apps/<app>/index.html (inglés).

Uso:
  npm run build:apps                       usa scripts/suite.json y las capturas que ya están en resources/screenshots/suite/
  npm run build:apps -- --actualizar       antes trae de ~/crohub las fichas (src/datos/apps.json) y las capturas, y del
                                           catálogo firmado la versión y los sistemas de cada app; deja scripts/suite.json
                                           (las capturas que ya existen no se tocan; con --forzar se rehacen todas)

Los textos de las capturas vienen de CroHub (ya traen los dos idiomas). Lo único que se escribe aquí es la categoría y la
descripción en inglés (EN abajo) y los textos de la página (TXT)."""
import base64, json, os, re, sys, urllib.request

RAIZ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SUITE = os.path.join(RAIZ, 'scripts/suite.json')
CAPTURAS = os.path.join(RAIZ, 'resources/screenshots/suite')   # <app>-NN-<idioma>.webp (1200 px; también las usa el lanzador simulado de la portada)
CROHUB = os.path.expanduser(os.environ.get('CROHUB_DIR', '~/crohub'))
CATALOGO = 'https://activation.ollin-tep.com/api/v1/catalogo'
SITIO = 'https://ollin-tep.com/'
# orden de la portada
ORDEN = ['crovite-pdf', 'croma-studio', 'cronmy', 'crovect-studio', 'cromofi', 'croudio', 'crobeat', 'cromix', 'croguard']
NOMBRE_VISIBLE = {'cromix': 'CroGroove'}   # el id del catálogo sigue siendo cromix

EN = {
    'crovite-pdf': ('PDF documents', 'Edit, sign, convert and organize your PDF documents.'),
    'croma-studio': ('Photos and montages', 'Edit photos in layers, adjust color, remove backgrounds with AI, develop your photos with presets and make collages for social media.'),
    'cronmy': ('Photos and color', 'Photo editing and color correction.'),
    'crovect-studio': ('Vector design', 'Vector design, interface prototypes and Lottie animation.'),
    'cromofi': ('Video', 'Edit video, correct the color and add automatic subtitles.'),
    'croudio': ('Audio', 'Record, edit and clean up audio.'),
    'crobeat': ('Music', 'Make beats and produce music.'),
    'cromix': ('Music and DJ', 'Mix music like a DJ: 4 decks, effects, stems, sampler and controllers.'),
    'croguard': ('VPN', 'VPN, antivirus and network tools to protect your computer.'),
}

# entradilla de cada ficha: el subtítulo de su captura principal (el mismo texto que trae la captura de CroHub)
LEMA = {
    'crovite-pdf': ('Edita, firma, rellena, combina, protege y pregunta a la IA, en tu equipo y sin conexión.',
                    'Edit, sign, fill in, combine, protect and ask the AI, on your computer and offline.'),
    'croma-studio': ('Capas, color, fondos quitados con IA, revelado con preajustes y collages para redes, en tu equipo.',
                     'Layers, color, AI background removal, developing with presets and collages for social media, on your computer.'),
    'cronmy': ('Luz, color, curvas, máscaras, quitar ruido y superresolución para RAW, JPEG y TIFF, sin conexión.',
               'Light, color, curves, masks, noise reduction and super-resolution for RAW, JPEG and TIFF, offline.'),
    'crovect-studio': ('Vectores con curvas Bézier, animación por keyframes que exporta a Lottie y prototipos de apps con simulador.',
                       'Vectors with Bézier curves, keyframe animation that exports to Lottie, and app prototypes with a simulator.'),
    'cromofi': ('Línea de tiempo multipista, corrección de color, subtítulos automáticos con IA y mezcla de sonido, en tu equipo.',
                'Multitrack timeline, color correction, automatic AI subtitles and sound mixing, on your computer.'),
    'croudio': ('Multipista, mezclador con buses, efectos en tiempo real y limpieza de voz con IA en tu equipo.',
                'Multitrack, a mixer with buses, real-time effects and AI voice cleanup on your computer.'),
    'crobeat': ('Secuenciador por pasos, piano roll, mezclador y máster, y exporta a WAV, MP3, FLAC, stems y MIDI.',
                'Step sequencer, piano roll, mixer and mastering, with export to WAV, MP3, FLAC, stems and MIDI.'),
    'cromix': ('Mezcla como DJ con 2 o 4 platos, efectos, stems, sampler y controladoras MIDI.',
               'Mix like a DJ with 2 or 4 decks, effects, stems, a sampler and MIDI controllers.'),
    'croguard': ('VPN, antivirus, tu red y el rendimiento en una sola app.',
                 'VPN, antivirus, your network and performance in one app.'),
}

TXT = {
    'es': {
        'saltar': 'Saltar al contenido', 'menu': 'Abrir menú de navegación', 'arriba': 'Volver arriba',
        'nav': [('#capturas', 'Capturas'), ('#empezar', 'Cómo empezar'), ('#suite', 'Más apps')],
        'descargar': 'Descargar CroHub', 'comprar': 'Comprar una licencia',
        'version': 'Versión', 'sistemas': 'Disponible para',
        'capturas_eyebrow': 'Así se ve', 'capturas_titulo': 'Por dentro.',
        'capturas_lead': 'Capturas de la app real. Toca una para verla en grande.',
        'empezar_eyebrow': 'Cómo empezar', 'empezar_titulo': 'Tres pasos y a trabajar.',
        'pasos': [
            ('fa-download', 'Descarga CroHub', 'El lanzador de la suite. Es gratis y se actualiza solo.'),
            ('fa-cubes', 'Instala {app}', 'Desde CroHub, con un clic. CroHub también la mantiene al día.'),
            ('fa-key', 'Activa tu licencia', 'Compra la de {app} o el paquete con toda la suite, y pega la clave en CroHub.'),
        ],
        'suite_eyebrow': 'Suite CroHub', 'suite_titulo': 'Nueve apps. Un solo lanzador.',
        'suite_lead': 'Cada app se compra por separado, o todas juntas en el paquete de la suite.',
        'pie_marca': 'Una app de la suite CroHub, de Ollin-Tep Software.',
        'origen': 'Originarios de Tepic, Nayarit, México', 'inicio': 'Inicio', 'suite': 'Suite CroHub',
        'a_medida': 'Software a medida', 'contacto': 'Contacto', 'apps': 'Apps',
        'derechos': 'Ollin-Tep Software. Todos los derechos reservados.',
        'privacidad': 'Aviso de privacidad', 'legal': 'Textos legales de CroHub',
        'captura_alt': 'Captura de {app}: {t}',
        'titulo': '{app} · {cat} | Suite CroHub', 'og_locale': 'es_MX',
    },
    'en': {
        'saltar': 'Skip to content', 'menu': 'Open navigation menu', 'arriba': 'Back to top',
        'nav': [('#capturas', 'Screenshots'), ('#empezar', 'Get started'), ('#suite', 'More apps')],
        'descargar': 'Download CroHub', 'comprar': 'Buy a license',
        'version': 'Version', 'sistemas': 'Available for',
        'capturas_eyebrow': 'A look inside', 'capturas_titulo': 'Inside the app.',
        'capturas_lead': 'Screenshots of the real app. Tap one to see it full size.',
        'empezar_eyebrow': 'Get started', 'empezar_titulo': 'Three steps and you’re working.',
        'pasos': [
            ('fa-download', 'Download CroHub', 'The suite launcher. It’s free and updates itself.'),
            ('fa-cubes', 'Install {app}', 'From CroHub, in one click. CroHub keeps it up to date too.'),
            ('fa-key', 'Activate your license', 'Buy the {app} license or the bundle with the whole suite, and paste the key into CroHub.'),
        ],
        'suite_eyebrow': 'CroHub suite', 'suite_titulo': 'Nine apps. One launcher.',
        'suite_lead': 'Buy each app on its own, or all of them together in the suite bundle.',
        'pie_marca': 'An app in the CroHub suite, by Ollin-Tep Software.',
        'origen': 'Born in Tepic, Nayarit, Mexico', 'inicio': 'Home', 'suite': 'CroHub suite',
        'a_medida': 'Custom software', 'contacto': 'Contact', 'apps': 'Apps',
        'derechos': 'Ollin-Tep Software. All rights reserved.',
        'privacidad': 'Privacy notice', 'legal': 'CroHub legal texts',
        'captura_alt': '{app} screenshot: {t}',
        'titulo': '{app} · {cat} | CroHub suite', 'og_locale': 'en_US',
    },
}

IDIOMA_JS = """<script>/*idioma*/(function(){try{var k='ollintep-idioma',s=localStorage,q=new URLSearchParams(location.search).get('lang');if(q==='es'||q==='en')s.setItem(k,q);var g=s.getItem(k);if(g==='es'||/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|lighthouse/i.test(navigator.userAgent))return;var l=g||(navigator.languages||[navigator.language]).map(function(x){return(x||'').slice(0,2)}).filter(function(x){return x==='es'||x==='en'})[0]||'en';if(l==='en')location.replace('/en'+location.pathname+location.search+location.hash)}catch(e){}})();</script>"""


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def sistemas_de(archivos):
    s = []
    if any(k.startswith('win') for k in archivos): s.append('Windows')
    if any(k.startswith('linux') for k in archivos): s.append('Linux')
    if any(k.startswith('mac') for k in archivos): s.append('macOS')
    return s


def actualizar():
    from PIL import Image
    apps = {a['id']: a for a in json.load(open(os.path.join(CROHUB, 'src/datos/apps.json'), encoding='utf-8'))['apps']}
    firmado = urllib.request.urlopen(urllib.request.Request(CATALOGO, headers={'User-Agent': 'ollintep-web'}), timeout=30).read().decode()
    carga = json.loads(firmado)['catalogo'].split('.')[0]   # {ok, catalogo: "<carga en base64url>.<firma>"}
    catalogo = json.loads(base64.urlsafe_b64decode(carga + '=' * (-len(carga) % 4)))['apps']
    suite = []
    for i in ORDEN:
        a, c = apps[i], catalogo.get(i, {})
        suite.append({
            'id': i, 'nombre': NOMBRE_VISIBLE.get(i, a['nombre']), 'acento': a['acento'],
            'categoria': {'es': a['categoria'], 'en': EN[i][0]}, 'descripcion': {'es': a['descripcion'], 'en': EN[i][1]},
            'capturas': {l: [{'archivo': x['archivo'], 'titulo': x['titulo']} for x in a['capturas'][l]] for l in ('es', 'en')},
            'version': c.get('version', ''), 'sistemas': sistemas_de(c.get('files', {})),
        })
        origen = os.path.join(CROHUB, 'src/renderer/img/capturas', i)
        for l in ('es', 'en'):
            for x in a['capturas'][l]:
                im = Image.open(os.path.join(origen, x['archivo']))
                for ancho, sufijo in ((1200, ''), (800, '-800')):
                    destino = os.path.join(CAPTURAS, f"{i}-{x['archivo'].replace('.webp', '')}{sufijo}.webp")
                    if os.path.exists(destino) and '--forzar' not in sys.argv:
                        continue   # ya está: recodificarla solo cambia el ruido de compresión
                    im.resize((ancho, round(ancho * im.height / im.width)), Image.LANCZOS).save(destino, 'WEBP', quality=84, method=6)
    json.dump({'apps': suite}, open(SUITE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('suite.json y capturas al día (del catálogo solo se leen versión y sistemas; la firma no se comprueba)')


def imagen(r, app, x, l, tam, carga):
    f = f'{r}resources/screenshots/suite/{app["id"]}-{x["archivo"]}'
    return (f'<img src="{f}" srcset="{f.replace(".webp", "-800.webp")} 800w, {f} 1200w" sizes="{tam}" width="1200" height="900" '
            f'alt="{esc(TXT[l]["captura_alt"].format(app=app["nombre"], t=x["titulo"]))}" {carga}>')


def pagina(app, todas, l):
    t, n = TXT[l], app['nombre']
    r = '../../' if l == 'es' else '../../../'       # raíz del sitio desde apps/<id>/ o en/apps/<id>/
    pre = '' if l == 'es' else 'en/'
    url = f'{SITIO}{pre}apps/{app["id"]}/'
    url_es, url_en = f'{SITIO}apps/{app["id"]}/', f'{SITIO}en/apps/{app["id"]}/'
    cat, caps = app['categoria'][l], app['capturas'][l]
    desc = LEMA[app['id']][0 if l == 'es' else 1]
    q = '' if l == 'es' else '?lang=en'
    descargar, comprar = f'https://activation.ollin-tep.com/descargar{q}', f'https://activation.ollin-tep.com/comprar{q}'
    icono = f'{r}resources/suite/{app["id"]}-icono.svg'
    titulo = t['titulo'].format(app=n, cat=cat)
    og = f'{SITIO}resources/screenshots/suite/{app["id"]}-{caps[0]["archivo"]}'
    ld = {'@context': 'https://schema.org', '@type': 'SoftwareApplication', 'name': n, 'applicationCategory': 'DesktopApplication',
          'operatingSystem': ', '.join(app['sistemas']), 'url': url, 'description': desc, 'image': og, 'inLanguage': l,
          'softwareVersion': app['version'], 'downloadUrl': descargar,
          'publisher': {'@type': 'Organization', 'name': 'Ollin-Tep Software', 'url': SITIO}}
    nav = ''.join(f'<li><a href="{h}">{x}</a></li>' for h, x in t['nav'])
    datos = ''.join(f'<li>{s}</li>' for s in app['sistemas'])
    perezosa = 'loading="lazy" decoding="async"'
    galeria = ''.join(
        f'<figure class="ficha-shot"><div class="ficha-shot-img">{imagen(r, app, x, l, "(min-width: 960px) 560px, 92vw", perezosa)}</div>'
        f'<figcaption><span>{i:02d}</span>{esc(x["titulo"])}</figcaption></figure>'
        for i, x in enumerate(caps[1:], 2))
    pasos = ''.join(f'<li><i class="fas {ico}" aria-hidden="true"></i><h3>{esc(h.format(app=n))}</h3><p>{esc(p.format(app=n))}</p></li>' for ico, h, p in t['pasos'])
    otras = ''.join(
        f'<li><a href="../{o["id"]}/" style="--app: {o["acento"]}"><img src="{r}resources/suite/{o["id"]}-icono.svg" alt="" width="40" height="40" loading="lazy">'
        f'<span><strong>{esc(o["nombre"])}</strong><small>{esc(o["categoria"][l])}</small></span></a></li>'
        for o in todas if o['id'] != app['id'])
    pie_apps = ''.join(f'<li><a href="../{o["id"]}/">{esc(o["nombre"])}</a></li>' for o in todas if o['id'] != app['id'])
    return f'''<!DOCTYPE html>
<html lang="{l}" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    {IDIOMA_JS if l == 'es' else ''}
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(titulo)}</title>
    <meta name="description" content="{esc(desc)}">
    <link rel="canonical" href="{url}">
    <link rel="alternate" hreflang="es" href="{url_es}">
    <link rel="alternate" hreflang="en" href="{url_en}">
    <link rel="alternate" hreflang="x-default" href="{url_es}">
    <meta name="theme-color" content="#080d18">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Ollin-Tep Software">
    <meta property="og:locale" content="{t['og_locale']}">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{esc(n)} · {esc(cat)}">
    <meta property="og:description" content="{esc(desc)}">
    <meta property="og:image" content="{og}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="900">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{esc(n)} · {esc(cat)}">
    <meta name="twitter:description" content="{esc(desc)}">
    <meta name="twitter:image" content="{og}">
    <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
    <link rel="icon" type="image/svg+xml" href="{icono}">
    <link rel="preload" href="{r}resources/fuentes/figtree-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="{r}resources/fuentes/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="{r}css/styles.css?v=@@V@@">
    <link rel="stylesheet" href="{r}resources/iconos/iconos.css?v=@@V@@">
</head>
<body class="ficha-app" style="--app: {app['acento']}">
    <a class="skip-link" href="#inicio">{t['saltar']}</a>
    <div class="liquid-bg" aria-hidden="true"><span class="blob blob-1"></span><span class="blob blob-2"></span><span class="blob blob-3"></span></div>

    <header class="header">
        <div class="scroll-progress" id="scroll-progress"></div>
        <nav class="navbar">
            <a href="#inicio" class="logo">
                <img src="{icono}" alt="" class="logo-mark logo-mark-app" width="32" height="32">
                <span class="logo-word"><span class="logo-ollintep">{esc(n)}</span></span><span class="logo-by">by Ollin-Tep</span>
            </a>
            <ul class="nav-links" id="nav-links">
                {nav}
                <li><a href="{r}{pre}index.html#suite" class="product-back-btn text-xs px-3 py-1 rounded-full"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i>Ollin-Tep</a></li>
            </ul>
            <button class="menu-toggle" id="mobile-menu" aria-label="{t['menu']}" aria-expanded="false" aria-controls="nav-links">
                <span class="bar"></span><span class="bar"></span><span class="bar"></span>
            </button>
        </nav>
    </header>

    <main>
    <section id="inicio" class="ficha-hero">
        <div class="ficha-hero-texto">
            <p class="ficha-cat"><img src="{icono}" alt="" width="28" height="28">{esc(cat)}</p>
            <h1>{esc(caps[0]['titulo'])}</h1>
            <p class="hero-lead">{esc(desc)}</p>
            <div class="hero-btns">
                <a href="{descargar}" class="m3-btn m3-btn-filled">{t['descargar']} <i class="fas fa-download text-xs" aria-hidden="true"></i></a>
                <a href="{comprar}" class="m3-btn m3-btn-tonal">{t['comprar']} <i class="fas fa-store text-xs" aria-hidden="true"></i></a>
                <p class="so-nota"></p>
            </div>
            <dl class="ficha-datos">
                <div><dt>{t['version']}</dt><dd>{esc(app['version'])}</dd></div>
                <div><dt>{t['sistemas']}</dt><dd><ul>{datos}</ul></dd></div>
            </dl>
        </div>
        <figure class="product-shot ficha-principal">
            {imagen(r, app, caps[0], l, "(min-width: 1100px) 600px, 92vw", 'fetchpriority="high"')}
        </figure>
    </section>

    <section id="capturas" class="section-block">
        <header class="block-head"><div>
            <p class="eyebrow">{t['capturas_eyebrow']}</p>
            <h2 class="block-title">{t['capturas_titulo']}</h2>
            <p class="block-lead">{t['capturas_lead']}</p>
        </div></header>
        <div class="ficha-galeria">{galeria}</div>
    </section>

    <section id="empezar" class="section-block">
        <header class="block-head"><div>
            <p class="eyebrow">{t['empezar_eyebrow']}</p>
            <h2 class="block-title">{t['empezar_titulo']}</h2>
        </div></header>
        <ol class="ficha-pasos">{pasos}</ol>
        <div class="block-ctas ficha-ctas">
            <a href="{descargar}" class="m3-btn m3-btn-filled">{t['descargar']} <i class="fas fa-download text-xs" aria-hidden="true"></i></a>
            <a href="{comprar}" class="m3-btn m3-btn-tonal">{t['comprar']} <i class="fas fa-store text-xs" aria-hidden="true"></i></a>
        </div>
    </section>

    <section id="suite" class="section-block">
        <header class="block-head"><div>
            <p class="eyebrow eyebrow-crohub"><img src="{r}resources/suite/crohub.svg" alt="" width="15" height="16">{t['suite_eyebrow']}</p>
            <h2 class="block-title">{t['suite_titulo']}</h2>
            <p class="block-lead">{t['suite_lead']}</p>
        </div></header>
        <ul class="ficha-otras">{otras}</ul>
    </section>
    </main>

    <footer class="footer">
        <div class="footer-content footer-grid">
            <div class="footer-brand">
                <a href="#inicio" class="logo">
                    <img src="{icono}" alt="" class="logo-mark logo-mark-app" width="32" height="32">
                    <span class="logo-word"><span class="logo-ollintep">{esc(n)}</span></span><span class="logo-by">by Ollin-Tep</span>
                </a>
                <p>{t['pie_marca']}</p>
                <p class="footer-origen"><i class="fas fa-location-dot" aria-hidden="true"></i>{t['origen']}</p>
            </div>
            <nav class="footer-col" aria-label="Ollin-Tep">
                <h3>Ollin-Tep</h3>
                <ul>
                    <li><a href="{r}{pre}index.html">{t['inicio']}</a></li>
                    <li><a href="{r}{pre}index.html#suite">{t['suite']}</a></li>
                    <li><a href="{r}{pre}index.html#a-medida">{t['a_medida']}</a></li>
                </ul>
            </nav>
            <nav class="footer-col" aria-label="{t['apps']}">
                <h3>{t['apps']}</h3>
                <ul>{pie_apps}</ul>
            </nav>
            <div class="footer-col">
                <h3>{t['contacto']}</h3>
                <ul>
                    <li><a href="mailto:administrador@ollin-tep.com">administrador@ollin-tep.com</a></li>
                    <li><a href="tel:+523111275020">+52 311 127 5020</a></li>
                </ul>
            </div>
        </div>
        <p class="footer-copy">&copy; <span id="current-year">2026</span> {t['derechos']}</p>
        <p class="footer-legal"><a href="https://activation.ollin-tep.com/legal/{'privacidad' if l == 'es' else 'privacy'}">{t['privacidad']}</a><span aria-hidden="true"> · </span><a href="https://activation.ollin-tep.com/legal">{t['legal']}</a></p>
    </footer>

    <button id="back-to-top" class="back-to-top" aria-label="{t['arriba']}"><i class="fas fa-arrow-up" aria-hidden="true"></i></button>

    <script src="{r}script/scripts.js?v=@@V@@"></script>
    <script src="{r}script/efectos.js?v=@@V@@"></script>
</body>
</html>
'''


def main():
    if '--actualizar' in sys.argv:
        actualizar()
    todas = json.load(open(SUITE, encoding='utf-8'))['apps']
    # la versión de los recursos es la misma que usa la portada
    v = re.search(r'styles\.css\?v=([\d.]+)', open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()).group(1)
    for app in todas:
        for l in ('es', 'en'):
            destino = os.path.join(RAIZ, '' if l == 'es' else 'en', 'apps', app['id'], 'index.html')
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            open(destino, 'w', encoding='utf-8').write(pagina(app, todas, l).replace('@@V@@', v))
    print(f'Generadas {len(todas) * 2} fichas en apps/ y en/apps/ (?v={v})')


main()
