#!/usr/bin/env python3
"""Genera las páginas en inglés (en/…) a partir de las páginas en español y scripts/en.json.
Uso: npm run build:en. Si aparece un texto sin traducción, avisa y no escribe nada: añádelo a en.json."""
import json, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DIC = json.load(open(os.path.join(RAIZ, 'scripts/en.json'), encoding='utf-8'))
IGUAL = set(DIC.pop('_igual')) | {'@@ALT@@'}
PAGINAS = ['index.html', 'centzontle/index.html', 'actapro/index.html', 'agrocria/index.html', 'diagmind/index.html']
NO_ES_TEXTO = re.compile(r'^(https?:|width=|#|summary_|website$|en_US$|noindex$|\d|[\w.+-]+@)')
faltan = {}


def tiene_letras(s):
    return re.search(r'[A-Za-zÁÉÍÓÚáéíóúñÑ]', re.sub(r'&\w+;', '', s))


def traducir(s, pagina):
    clave = re.sub(r'\s+', ' ', s).strip()
    if not clave or not tiene_letras(clave) or clave in IGUAL:
        return s
    if clave in DIC:
        return s.replace(s.strip(), DIC[clave]) if s.strip() == clave else re.sub(r'\S(?:.*\S)?', lambda _: DIC[clave], s, flags=re.S)
    faltan.setdefault(clave, pagina)
    return s


def html_a_en(trozo, pagina):
    trozo = re.sub(r'<!--.*?-->\s*', '', trozo, flags=re.S)
    trozo = re.sub(r'>([^<>]+)<', lambda m: '>' + traducir(m.group(1), pagina) + '<', trozo)
    def atributo(m):
        v = m.group(2)
        return m.group(0) if NO_ES_TEXTO.match(v.strip()) else f'{m.group(1)}="{traducir(v, pagina)}"'
    return re.sub(r'\b(alt|aria-label|title|placeholder|content)="([^"]*)"', atributo, trozo)


def ld_a_en(trozo, pagina):
    return re.sub(r'"(description|name|applicationCategory|areaServed)": "([^"]+)"',
                  lambda m: f'"{m.group(1)}": "{traducir(m.group(2), pagina)}"', trozo)


def generar(pagina):
    t = open(os.path.join(RAIZ, pagina), encoding='utf-8').read()
    t = re.sub(r'\s*<script>/\*idioma\*/.*?</script>', '', t, count=1, flags=re.S)   # en inglés no se redirige
    # la descarga y la activación tienen versión en inglés
    t = t.replace('https://activation.ollin-tep.com/descargar"', 'https://activation.ollin-tep.com/descargar?lang=en"').replace('https://activation.ollin-tep.com/"', 'https://activation.ollin-tep.com/?lang=en"')
    t = t.replace('<html lang="es"', '<html lang="en"').replace('es_MX', 'en_US').replace('-og-v3.jpg', '-og-en.jpg')
    # direcciones: las alternas se dejan como están; las demás del sitio pasan a /en/
    alternas = re.findall(r'\s*<link rel="alternate"[^>]*>', t)
    t = re.sub(r'\s*<link rel="alternate"[^>]*>', '<!--ALT-->', t, count=1)
    t = re.sub(r'\s*<link rel="alternate"[^>]*>', '', t)
    t = re.sub(r'https://ollin-tep\.com/(?!resources/)', 'https://ollin-tep.com/en/', t)
    t = t.replace('<!--ALT-->', '@@ALT@@')
    # recursos: un nivel más hondo
    if '/' in pagina:
        t = re.sub(r'((?:src|href)=")\.\./(resources|css|script)/', r'\1../../\2/', t)
    else:
        t = re.sub(r'((?:src|href)=")(resources|css|script)/', r'\1../\2/', t)
    partes = re.split(r'(<script\b.*?</script>|<style\b.*?</style>)', t, flags=re.S)
    for i, p in enumerate(partes):
        if p.startswith('<style'):
            continue
        if p.startswith('<script'):
            if 'ld+json' in p:
                partes[i] = ld_a_en(p, pagina)
        else:
            partes[i] = html_a_en(p, pagina)
    return ''.join(partes).replace('@@ALT@@', ''.join(alternas))


salidas = {p: generar(p) for p in PAGINAS}
if faltan:
    print('Textos sin traducción en scripts/en.json:')
    for k, p in faltan.items():
        print(f'  [{p}] {k}')
    sys.exit(1)
for p, t in salidas.items():
    destino = os.path.join(RAIZ, 'en', p)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, 'w', encoding='utf-8').write(t)
print(f'Generadas {len(salidas)} páginas en en/')
