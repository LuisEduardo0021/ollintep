// Efectos de diseño por página. Todos son decorativos (aria-hidden) y cada uno se activa solo si su marcador está en el HTML.
// Regla común: con movimiento reducido o modo ligero no se anima nada; los costosos solo corren en escritorio y a la vista.
(() => {
    const raiz = document.documentElement;
    const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ligero = () => raiz.classList.contains('ligero');
    const escritorio = matchMedia('(min-width: 961px)').matches;
    const mueve = () => !reducido && !ligero();
    const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const base = document.querySelector('script[src*="efectos.js"]').src;

    // Ejecuta dibujar(t) a `fps` solo mientras el elemento esté a la vista y no haya modo ligero
    const bucle = (el, fps, dibujar) => {
        let visible = false, marco = 0, antes = 0;
        const paso = (t) => {
            marco = 0;
            if (!visible || !mueve()) return;
            if (t - antes >= 1000 / fps) { antes = t; dibujar(t / 1000); }
            marco = requestAnimationFrame(paso);
        };
        new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible && !marco) marco = requestAnimationFrame(paso);
        }, { rootMargin: '10% 0px' }).observe(el);
    };
    const lienzo = (clase) => {
        const c = document.createElement('canvas');
        c.className = clase;
        c.setAttribute('aria-hidden', 'true');
        return c;
    };

    // --- METABALLS (Suite): nueve gotas de color, una por app, se funden en una al hacer scroll. «Nueve apps. Un solo lanzador.»
    document.querySelectorAll('[data-metaballs]').forEach(caja => {
        if (!escritorio || !mueve()) return caja.remove();
        const c = lienzo('metaballs-lienzo');
        const gl = c.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
        if (!gl) return caja.remove();
        const COLORES = ['#f97316', '#fbbf24', '#84cc16', '#a855f7', '#14b8a6', '#ef4444', '#ec4899', '#22d3ee', '#3b82f6'];
        const rgb = COLORES.flatMap(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255));
        const compilar = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
        const prog = gl.createProgram();
        gl.attachShader(prog, compilar(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
        gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, `precision mediump float;
            uniform vec3 b[9];uniform vec3 k[9];uniform vec2 r;uniform float m;
            void main(){vec2 u=gl_FragCoord.xy;float f=0.;vec3 col=vec3(0.);
            for(int i=0;i<9;i++){vec2 d=u-b[i].xy;float v=b[i].z*b[i].z/max(dot(d,d),1.);f+=v;col+=k[i]*v;}
            col/=max(f,.001);col=mix(col,vec3(1.,.478,.18),m);
            float a=smoothstep(.95,1.08,f);float brillo=smoothstep(1.08,2.6,f)*.28;
            gl_FragColor=vec4((col+brillo)*a,a);}`));
        gl.linkProgram(prog);
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.bindAttribLocation(prog, 0, 'p');
        gl.linkProgram(prog);
        gl.useProgram(prog);
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'p'), 2, gl.FLOAT, false, 0, 0);
        gl.uniform3fv(gl.getUniformLocation(prog, 'k'), new Float32Array(rgb));
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const uB = gl.getUniformLocation(prog, 'b'), uM = gl.getUniformLocation(prog, 'm');
        caja.append(c);
        const medir = () => { c.width = caja.clientWidth; c.height = caja.clientHeight; gl.viewport(0, 0, c.width, c.height); };
        medir();
        addEventListener('resize', medir);
        const pos = new Float32Array(27);
        bucle(caja, 40, (t) => {
            const r = caja.getBoundingClientRect();
            const p = limitar((innerHeight * .92 - r.top) / (innerHeight * .55));
            const e = p * p * (3 - 2 * p);
            const w = c.width, h = c.height;
            for (let i = 0; i < 9; i++) {
                const ox = w * (.08 + i * .105), oy = h / 2 + Math.sin(t * .9 + i * 1.7) * h * .16;
                pos[i * 3] = ox + (w / 2 - ox) * e + Math.cos(t * .7 + i) * 7 * (1 - e * .6);
                pos[i * 3 + 1] = oy + (h / 2 - oy) * e;
                pos[i * 3 + 2] = (h * .19) * (1 - e * .22) + Math.sin(t + i * 2) * 1.5;
            }
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform3fv(uB, pos);
            gl.uniform1f(uM, limitar((e - .72) / .28));
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        });
    });

    // --- TIPOGRAFÍA CINÉTICA (Cómo trabajamos): las letras entran en cascada y se levantan al pasar el cursor
    document.querySelectorAll('[data-cinetica]').forEach(titulo => {
        if (!mueve()) return;
        const texto = titulo.textContent.trim();
        titulo.setAttribute('aria-label', texto);
        titulo.textContent = '';
        let n = 0;
        const letras = [];
        texto.split(' ').forEach((palabra, i) => {
            const w = document.createElement('span');
            w.className = 'cin-palabra';
            w.setAttribute('aria-hidden', 'true');
            [...palabra].forEach(ch => {
                const l = document.createElement('span');
                l.className = 'cin-letra';
                l.textContent = ch;
                l.style.setProperty('--i', n++);
                w.append(l);
                letras.push(l);
            });
            titulo.append(w);
            if (i < texto.split(' ').length - 1) titulo.append(' ');
        });
        titulo.classList.add('cin');
        new IntersectionObserver(([e], o) => { if (e.isIntersecting) { titulo.classList.add('cin-entra'); o.disconnect(); } }, { threshold: .35 }).observe(titulo);
        if (!matchMedia('(hover: hover)').matches) return;
        let pendiente = 0, cx = 0, cy = 0, centros = [];
        titulo.addEventListener('pointerenter', () => { centros = letras.map(l => { const r = l.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); });
        titulo.addEventListener('pointermove', (e) => {
            cx = e.clientX; cy = e.clientY;
            if (pendiente) return;
            pendiente = requestAnimationFrame(() => {
                pendiente = 0;
                letras.forEach((l, i) => {
                    const d = limitar(1 - Math.hypot(centros[i][0] - cx, centros[i][1] - cy) / 150);
                    l.style.setProperty('--d', (d * d).toFixed(3));
                });
            });
        });
        titulo.addEventListener('pointerleave', () => letras.forEach(l => l.style.setProperty('--d', 0)));
    });

    // --- NEÓN (Contacto): el título parpadea al encenderse, como un letrero bajo la lluvia del fondo
    document.querySelectorAll('.neon-texto').forEach(el => {
        new IntersectionObserver(([e], o) => { if (e.isIntersecting) { el.classList.add('neon-on'); o.disconnect(); } }, { threshold: .6 }).observe(el);
    });

    // --- FOIL HOLOGRÁFICO (plan destacado): la iridiscencia sigue al cursor, como un sello de seguridad
    document.querySelectorAll('.plan-featured').forEach(plan => {
        const foil = document.createElement('span');
        foil.className = 'foil';
        foil.setAttribute('aria-hidden', 'true');
        plan.append(foil);
        // Con inercia: pegado al cursor se siente artificial
        let ox = 30, oy = 20, x = 30, y = 20, marco = 0;
        const mover = () => {
            x += (ox - x) * .14;
            y += (oy - y) * .14;
            foil.style.setProperty('--fx', `${x.toFixed(1)}%`);
            foil.style.setProperty('--fy', `${y.toFixed(1)}%`);
            marco = Math.abs(ox - x) + Math.abs(oy - y) > .1 ? requestAnimationFrame(mover) : 0;
        };
        plan.addEventListener('pointermove', (e) => {
            const r = plan.getBoundingClientRect();
            ox = (e.clientX - r.left) / r.width * 100;
            oy = (e.clientY - r.top) / r.height * 100;
            if (!marco && mueve()) marco = requestAnimationFrame(mover);
        }, { passive: true });
    });

    // --- LÍNEAS TOPOGRÁFICAS (Agro-Cria, balance hídrico): curvas de nivel calculadas con marching squares
    document.querySelectorAll('[data-topo]').forEach(seccion => {
        const c = lienzo('topo-lienzo');
        seccion.prepend(c);
        const ctx = c.getContext('2d');
        const PASO = 16, NIVELES = [-1.6, -1.2, -.8, -.4, 0, .4, .8, 1.2, 1.6];
        let col = 0, fil = 0;
        const medir = () => {
            c.width = raiz.clientWidth;
            c.height = Math.min(seccion.offsetHeight, 900);
            col = Math.ceil(c.width / PASO) + 1;
            fil = Math.ceil(c.height / PASO) + 1;
        };
        const campo = (x, y, t) => Math.sin(x * .19 + t) + Math.sin(y * .23 - t * .7) + Math.sin((x + y) * .11 + t * .4) * 1.1 + Math.sin(Math.hypot(x - 40, y - 12) * .27 - t * .5) * .7;
        const dibujar = (t) => {
            ctx.clearRect(0, 0, c.width, c.height);
            const v = new Float32Array(col * fil);
            for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) v[j * col + i] = campo(i, j, t * .05);
            NIVELES.forEach((n, k) => {
                ctx.beginPath();
                ctx.strokeStyle = k % 4 === 0 ? 'rgba(52, 211, 153, .3)' : 'rgba(52, 211, 153, .14)';
                for (let j = 0; j < fil - 1; j++) for (let i = 0; i < col - 1; i++) {
                    const a = v[j * col + i], b = v[j * col + i + 1], d = v[(j + 1) * col + i + 1], e = v[(j + 1) * col + i];
                    const pts = [];
                    const corta = (p, q, x1, y1, x2, y2) => { if ((p < n) !== (q < n)) { const f = (n - p) / (q - p); pts.push((x1 + (x2 - x1) * f) * PASO, (y1 + (y2 - y1) * f) * PASO); } };
                    corta(a, b, i, j, i + 1, j); corta(b, d, i + 1, j, i + 1, j + 1); corta(e, d, i, j + 1, i + 1, j + 1); corta(a, e, i, j, i, j + 1);
                    for (let q = 0; q + 3 < pts.length; q += 4) { ctx.moveTo(pts[q], pts[q + 1]); ctx.lineTo(pts[q + 2], pts[q + 3]); }
                }
                ctx.stroke();
            });
        };
        medir();
        dibujar(0);
        addEventListener('resize', () => { medir(); dibujar(0); });
        if (escritorio) bucle(c, 8, dibujar);
    });

    // --- ENJAMBRE DE PARTÍCULAS (Agro-Cria, hero): polinizadores que siguen al cursor o vagan por el campo
    document.querySelectorAll('[data-enjambre]').forEach(seccion => {
        if (!escritorio || !mueve()) return;
        const c = lienzo('enjambre-lienzo');
        seccion.append(c);
        const ctx = c.getContext('2d');
        const medir = () => { c.width = seccion.clientWidth; c.height = seccion.clientHeight; };
        medir();
        addEventListener('resize', medir);
        const N = 130;
        const px = new Float32Array(N).map(() => Math.random() * c.width), py = new Float32Array(N).map(() => Math.random() * c.height);
        const vx = new Float32Array(N), vy = new Float32Array(N);
        let mx = -1, my = -1, ultimo = -10;
        seccion.addEventListener('pointermove', (e) => { const r = seccion.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; ultimo = performance.now() / 1000; });
        bucle(seccion, 40, (t) => {
            const libre = t - ultimo > 2.5;
            const ax = libre ? c.width * (.5 + .36 * Math.sin(t * .23)) : mx, ay = libre ? c.height * (.42 + .28 * Math.sin(t * .37 + 1)) : my;
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.fillStyle = 'rgba(253, 230, 138, .75)';
            for (let i = 0; i < N; i++) {
                const dx = ax - px[i], dy = ay - py[i], d = Math.hypot(dx, dy) + 1;
                const giro = (i % 2 ? 1 : -1) * 0.5;
                vx[i] += (dx / d) * .16 - (dy / d) * giro * .16 + (Math.random() - .5) * .5;
                vy[i] += (dy / d) * .16 + (dx / d) * giro * .16 + (Math.random() - .5) * .5;
                vx[i] *= .955; vy[i] *= .955;
                px[i] += vx[i]; py[i] += vy[i];
                ctx.fillRect(px[i], py[i], i % 5 ? 1.6 : 2.4, i % 5 ? 1.6 : 2.4);
            }
        });
    });

    // --- ARTE ASCII: una imagen real del sitio (captura o logo) o un texto, en caracteres, con barrido de escaneo.
    // data-ascii = ruta dentro de resources/ · data-texto = texto a dibujar · data-color = color de los caracteres
    // En móvil o con movimiento reducido queda como una imagen fija; en modo ligero no se crea.
    const RAMPA = ' .:-=+*#%@';
    const crearAtlas = (color, AN, AL) => {
        const atlas = document.createElement('canvas');
        atlas.width = AN * RAMPA.length; atlas.height = AL;
        const ac = atlas.getContext('2d');
        ac.font = `${AL - 1}px ui-monospace, Menlo, Consolas, monospace`;
        ac.textBaseline = 'top';
        ac.fillStyle = color;
        [...RAMPA].forEach((ch, i) => ac.fillText(ch, i * AN, 0));
        return atlas;
    };
    document.querySelectorAll('[data-ascii], [data-texto]').forEach(caja => {
        if (ligero()) return caja.remove();
        const montar = (pintarFuente, curva) => {
            const c = lienzo('ascii-lienzo');
            caja.append(c);
            const ctx = c.getContext('2d');
            const AN = escritorio ? 8 : 6, AL = escritorio ? 14 : 10;
            const col = Math.ceil(caja.clientWidth / AN), fil = Math.ceil(caja.clientHeight / AL);
            c.width = col * AN; c.height = fil * AL;
            const m = document.createElement('canvas');
            m.width = col; m.height = fil;
            const mc = m.getContext('2d', { willReadFrequently: true });
            mc.fillStyle = '#000';
            mc.fillRect(0, 0, col, fil);
            pintarFuente(mc, col, fil, AN / AL);
            const datos = mc.getImageData(0, 0, col, fil).data;
            const lum = new Float32Array(col * fil);
            let min = 1, max = 0;
            lum.forEach((_, i) => { const v = (datos[i * 4] * .3 + datos[i * 4 + 1] * .59 + datos[i * 4 + 2] * .11) / 255; lum[i] = v; min = Math.min(min, v); max = Math.max(max, v); });
            lum.forEach((v, i) => { lum[i] = Math.pow((v - min) / Math.max(max - min, .01), curva); });
            const atlas = crearAtlas(caja.dataset.color || '#22e1f0', AN, AL);
            let mx = -999, my = -999;
            caja.addEventListener('pointermove', (e) => { const r = caja.getBoundingClientRect(); mx = (e.clientX - r.left) / AN; my = (e.clientY - r.top) / AL; });
            caja.addEventListener('pointerleave', () => { mx = my = -999; });
            const dibujar = (t) => {
                ctx.clearRect(0, 0, c.width, c.height);
                const barrido = ((t * .16) % 1.3) * col;
                for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) {
                    let v = lum[j * col + i];
                    v += Math.max(0, 1 - Math.abs(i - barrido) / 9) * .7;
                    v += Math.max(0, 1 - Math.hypot(i - mx, (j - my) * 1.8) / 11) * .6;
                    const g = Math.min(RAMPA.length - 1, Math.floor(v * RAMPA.length));
                    if (g > 0) ctx.drawImage(atlas, g * AN, 0, AN, AL, i * AN, j * AL, AN, AL);
                }
            };
            dibujar(-10);
            if (escritorio) bucle(caja, 14, dibujar);
        };
        if (caja.dataset.texto) {
            const fuentes = document.fonts?.ready || Promise.resolve();
            return fuentes.then(() => montar((mc, col, fil, k) => {
                // Se dibuja ancho y luego se comprime porque las celdas no son cuadradas
                mc.save();
                mc.scale(k, 1);
                mc.fillStyle = '#fff';
                mc.font = `800 ${Math.round(fil * .95)}px "Bricolage Grotesque", sans-serif`;
                mc.textAlign = 'center';
                mc.textBaseline = 'middle';
                mc.fillText(caja.dataset.texto, col / 2 / k, fil / 2);
                mc.restore();
            }, 1));
        }
        const img = new Image();
        img.onload = () => montar((mc, col, fil, k) => {
            if (caja.dataset.ascii.endsWith('.svg')) {
                // Logo: entero y centrado
                const e = (fil * .92) / img.height;
                const h = img.height * e, w = img.width * e / k;
                mc.drawImage(img, (col - w) / 2, (fil - h) / 2, w, h);
            } else {
                // Captura: recorte tipo «cover»
                const e = Math.max(col / (img.width / k), fil / img.height);
                const vw = col / (e / k), vh = fil / e;
                mc.drawImage(img, (img.width - vw) / 2, (img.height - vh) / 2, vw, vh, 0, 0, col, fil);
            }
        }, caja.dataset.ascii.endsWith('.svg') ? 1 : .42);
        img.onerror = () => caja.remove();
        img.src = new URL(`../resources/${caja.dataset.ascii}`, base).href;
    });

    // --- GLITCH (Diagmind y 404): ráfagas breves en el título; encaja con «diagnóstico» y con una página rota
    document.querySelectorAll('[data-glitch]').forEach(el => {
        if (!mueve()) return;
        const fijar = () => el.setAttribute('data-texto', el.textContent.trim());
        fijar();
        new MutationObserver(fijar).observe(el, { childList: true, characterData: true, subtree: false });
        el.classList.add('glitch');
        const rafaga = () => {
            if (!mueve()) return;
            el.classList.add('glitch-on');
            setTimeout(() => el.classList.remove('glitch-on'), 420);
        };
        el.addEventListener('pointerenter', rafaga);
        // Una vez al entrar y al pasar el cursor: repetido sobre un título que se está leyendo solo molesta
        setTimeout(rafaga, raiz.classList.contains('intro-marca') ? 3200 : 1400);
    });

    // --- PIXEL ART (Centzontle y 404): un centzontle, el pájaro que da nombre al producto, que canta de vez en cuando
    document.querySelectorAll('[data-pajaro]').forEach(c => {
        const PALETA = { g: '#94a3b8', d: '#475569', w: '#f1f5f9', l: '#e2e8f0', k: '#0f172a', p: '#8a5a33', a: '#ff7a2e' };
        const CUERPO = [
            '................',
            '................',
            '.....ggg........',
            '....ggggg.......',
            '..kkgkgggg......',
            '....ggggggg.....',
            '....lgggddddd...',
            '....llgdwwdddd..',
            '....llldddwwdddd',
            '.....lllddddd.dd',
            '.....lllldd...dd',
            '......k..k......',
            '.....pppppppppp.',
        ];
        const CANTA = CUERPO.map((f, i) => (i === 3 ? '..k.ggggg.......' : i === 4 ? '...kgkgggg......' : i === 5 ? '..kkggggggg.....' : f));
        const NOTA = ['.aa', '.a.', 'aa.'];
        const ctx = c.getContext('2d');
        c.width = 24; c.height = 20;
        const dibujar = (fig, nota) => {
            ctx.clearRect(0, 0, 24, 20);
            fig.forEach((f, y) => [...f].forEach((ch, x) => { if (PALETA[ch]) { ctx.fillStyle = PALETA[ch]; ctx.fillRect(x + 8, y + 7, 1, 1); } }));
            if (nota !== null) NOTA.forEach((f, y) => [...f].forEach((ch, x) => { if (PALETA[ch]) { ctx.fillStyle = PALETA[ch]; ctx.fillRect(x + 3 - Math.floor(nota / 2), y + 8 - nota, 1, 1); } }));
        };
        dibujar(CUERPO, null);
        if (reducido) return;
        const cantar = async () => {
            if (ligero() || document.hidden) return;
            for (let n = 0; n < 7; n++) {
                dibujar(n % 2 ? CUERPO : CANTA, n);
                await new Promise(r => setTimeout(r, 170));
            }
            dibujar(CUERPO, null);
        };
        setTimeout(cantar, 1800);
        setInterval(cantar, 6500);
    });

    // --- PIXEL ART: un sprite por página, cada uno ligado a lo que hace el producto. Solo se anima a la vista.
    const COLORES_PIXEL = { g: '#94a3b8', d: '#475569', w: '#f1f5f9', l: '#e2e8f0', k: '#0f172a', p: '#8a5a33', a: '#ff7a2e', b: '#6ea2ff', r: '#ef4444', v: '#34d399', o: '#059669', c: '#22e1f0', n: '#1e293b', y: '#fde047' };
    const pintarSprite = (ctx, figura, dx = 0, dy = 0) => figura.forEach((f, y) => [...f].forEach((ch, x) => {
        if (COLORES_PIXEL[ch]) { ctx.fillStyle = COLORES_PIXEL[ch]; ctx.fillRect(x + dx, y + dy, 1, 1); }
    }));
    const YUNQUE = ['................', '...dddddddddd...', 'gdddddddddddd...', '....dddddddd....', '.....dddddd.....', '....dddddddd....', '...dddddddddd...'];
    const MANGO = ['.......pp.......', '.......pp.......', '.......pp.......', '....gggggggg....', '....gddddddg....', '....gggggggg....'];
    const VACIO = '................';
    const columna = (filas) => [...filas, ...Array(Math.max(0, 16 - filas.length)).fill(VACIO)].slice(0, 16);
    const telefono = (scan) => columna(['....gggggggg....', ...Array.from({ length: 12 }, (_, i) => `....g${i === scan ? 'cccccc' : i % 3 === 0 ? 'nddddn' : 'nnnnnn'}g....`), '....gggggggg....', '......gggg......']);
    const SPRITES = {
        // Portada, «hecho con oficio»: martillo y yunque
        martillo: [
            columna([...MANGO, VACIO, VACIO, ...YUNQUE]),
            columna([VACIO, VACIO, ...MANGO, ...YUNQUE]),
            columna([VACIO, '..y..........y..', ...MANGO.slice(0, 5), '.y...gggggg...y.', ...YUNQUE]),
        ],
        // Portada, contacto: un sobre con un mensaje que sale
        sobre: [
            columna([VACIO, VACIO, VACIO, 'wwwwwwwwwwwwwwww', 'wgwwwwwwwwwwwwgw', 'wwggwwwwwwwwggww', 'wwwwggwwwwggwwww', 'wwwwwwggggwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww']),
            columna([VACIO, '...bbbbbbbbbb...', '...bwwwwwwwwb...', 'wwwbwbbbbbbwbwww', 'wgwbwwwwwwwwbwgw', 'wwgbwbbbbwwwbgww', 'wwwwggwwwwggwwww', 'wwwwwwggggwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww']),
        ],
        // ActaPro: el sello que da validez al acta
        sello: [
            columna(['.....dddddd.....', '.....dddddd.....', '.......dd.......', '....rrrrrrrr....', VACIO, '..wwwwwwwwwwww..', '..wggggggggggw..', '..wwwwwwwwwwww..', '..wggggggwwwww..', '..wwwwwwwwwwww..', '..wggggwwwwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..']),
            columna([VACIO, VACIO, VACIO, '.....dddddd.....', '.....dddddd.....', '..wwwwwddwwwww..', '..wgggrrrrrrgw..', '..wwwwwwwwwwww..', '..wggggggwwwww..', '..wwwwwwwwwwww..', '..wggggwwwwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..']),
            columna(['.....dddddd.....', '.....dddddd.....', '.......dd.......', '....rrrrrrrr....', VACIO, '..wwwwwwwwwwww..', '..wggggggggggw..', '..wwwwwwwwwwww..', '..wggggggwwwww..', '..wwwwwwwwwwww..', '..wggggwwrrrrw..', '..wwwwwwwrwwrw..', '..wwwwwwwrrrrw..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..']),
        ],
        // Agro-Cria: un brote que crece cuando el suelo tiene agua
        brote: [
            columna([...Array(12).fill(VACIO), '.......v........', 'pppppppvpppppppp', 'pppppppppppppppp', 'pppbpppppppbpppp']),
            columna([...Array(9).fill(VACIO), '.......v........', '.......v.vv.....', '.......vvv......', '.......v........', 'pppppppvpppppppp', 'pppppppppppppppp', 'pppbpppppppbpppp']),
            columna([...Array(6).fill(VACIO), '.......v........', '....vv.v........', '.....vvv........', '.......v.vv.....', '.......vvv......', '.......v........', '.......v........', 'pppppppvpppppppp', 'pppppppppppppppp', 'pppbpppppppbpppp']),
            columna([...Array(3).fill(VACIO), '......vvv.......', '.....vvovv......', '......vvv.......', '.......v........', '....vv.v........', '.....vvv........', '.......v.vv.....', '.......vvv......', '.......v........', 'pppppppvpppppppp', 'pppppppppppppppp', 'pppbpppppppbpppp'].slice(0, 13)),
        ],
        // Diagmind: un teléfono en diagnóstico, con la línea de escaneo
        telefono: [0, 2, 4, 6, 8, 10, 8, 6, 4, 2].map(telefono),
    };
    document.querySelectorAll('[data-pixel]').forEach(c => {
        const cuadros = SPRITES[c.dataset.pixel];
        if (!cuadros) return;
        const ctx = c.getContext('2d');
        c.width = 16; c.height = 16;
        pintarSprite(ctx, cuadros[0]);
        if (reducido) return;
        let visible = false;
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(c);
        let n = 0;
        const paso = () => {
            let espera = 260;
            if (visible && !ligero() && !document.hidden) {
                n = (n + 1) % cuadros.length;
                ctx.clearRect(0, 0, 16, 16);
                pintarSprite(ctx, cuadros[n]);
                if (n === cuadros.length - 1) espera = 1800;
            }
            setTimeout(paso, espera);
        };
        setTimeout(paso, 900);
    });

    // --- DITHERING (todas las páginas): banda de transición antes del pie, con matriz de Bayer 4×4. Es una imagen fija.
    // Por ella cruza de vez en cuando un centzontle en pixel art.
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const pie = document.querySelector('.footer');
    if (pie) {
        const c = document.createElement('canvas');
        c.width = 8; c.height = 40;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#6ea2ff';
        for (let y = 0; y < 40; y++) for (let x = 0; x < 8; x++) {
            const v = Math.sin((y / 39) * Math.PI) * .62;
            if (v > (BAYER[(y % 4) * 4 + (x % 4)] + .5) / 16) ctx.fillRect(x, y, 1, 1);
        }
        const banda = document.createElement('div');
        banda.className = 'dither-banda';
        banda.setAttribute('aria-hidden', 'true');
        banda.style.backgroundImage = `url(${c.toDataURL()})`;
        const marco = document.createElement('div');
        marco.className = 'dither-marco';
        marco.setAttribute('aria-hidden', 'true');
        marco.append(banda);
        pie.before(marco);
        if (!reducido) {
            const ave = lienzo('ave-vuelo');
            ave.width = 16; ave.height = 12;
            marco.append(ave);
            const av = ave.getContext('2d');
            const ALAS = [
                ['................', '.......dd.......', '.......ddd......', '..kgggdddddd.ddd', 'kkkgkggggggddddd', '...lllllldd...dd', '....lllll.......'],
                ['................', '................', '................', '..kggggggggd.ddd', 'kkkgkggggggddddd', '...lllddddd...dd', '.....ddd........', '.....dd.........'],
            ];
            let visible = false;
            new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(marco);
            let aleteo = 0;
            setInterval(() => { if (visible) { aleteo = 1 - aleteo; av.clearRect(0, 0, 16, 12); pintarSprite(av, ALAS[aleteo], 0, 2); } }, 170);
            const volar = () => {
                if (!visible || ligero() || document.hidden) return;
                ave.animate([{ translate: `${raiz.clientWidth}px 0` }, { translate: `-90px -18px` }], { duration: 7000, easing: 'linear' });
            };
            setInterval(volar, 12000);
            setTimeout(volar, 2500);
        }
    }

    // --- INTRO DE LA MARCA: una vez por sesión, al llegar desde fuera. El <head> pone html.intro-marca antes de pintar.
    // Caracteres que forman el logo, el logo pasa de pixelado a nítido, se escribe «Ollin-Tep» y se disuelve con Bayer.
    if (raiz.classList.contains('intro-marca')) {
        const cerrarSinIntro = () => raiz.classList.remove('intro-marca');
        try { sessionStorage.setItem('ollintep-intro', '1'); } catch (e) { /* sin almacenamiento se repite: no rompe nada */ }
        if (ligero() || document.hidden) cerrarSinIntro();
        else {
            const c = lienzo('intro-lienzo');
            document.body.append(c);
            const w = c.width = innerWidth, h = c.height = innerHeight;
            const ctx = c.getContext('2d');
            const FONDO = '#0b111e', AN = 9, AL = 16;
            const col = Math.ceil(w / AN), fil = Math.ceil(h / AL);
            const atlas = crearAtlas('#6ea2ff', AN, AL);
            const atlasClaro = crearAtlas('#dbe7ff', AN, AL);
            const ladoLogo = Math.min(h * .34, w * .44);
            const logoX = (w - ladoLogo * 1.049) / 2, logoY = h * .44 - ladoLogo / 2;
            const azar = new Float32Array(col * fil).map(() => Math.random());
            const glifoAzar = new Uint8Array(col * fil).map(() => 1 + Math.floor(Math.random() * (RAMPA.length - 1)));
            const mascara = new Uint8Array(col * fil);
            const logo = new Image();
            let logoListo = false;
            logo.onload = () => {
                const m = document.createElement('canvas');
                m.width = col; m.height = fil;
                const mc = m.getContext('2d', { willReadFrequently: true });
                mc.drawImage(logo, logoX / AN, logoY / AL, ladoLogo * 1.049 / AN, ladoLogo / AL);
                const d = mc.getImageData(0, 0, col, fil).data;
                mascara.forEach((_, i) => { mascara[i] = d[i * 4 + 3] > 90 ? 1 : 0; });
                logoListo = true;
            };
            logo.src = new URL('../resources/ollintep.svg', base).href;

            // Marca en fuente de píxeles 5×7; se conservan guion y T mayúscula: «Ollin-Tep»
            const LETRAS = {
                O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], l: ['01100', '00100', '00100', '00100', '00100', '00100', '01110'],
                i: ['00100', '00000', '01100', '00100', '00100', '00100', '01110'], n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'],
                '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
                e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'], p: ['00000', '00000', '11110', '10001', '10001', '11110', '10000', '10000'],
            };
            const MARCA = 'Ollin-Tep';
            const px = Math.max(3, Math.round(Math.min(w / 62, 8)));
            const anchoMarca = MARCA.length * 6 * px - px;
            const marcaX = Math.round((w - anchoMarca) / 2), marcaY = Math.round(logoY + ladoLogo + px * 5);
            const pintarMarca = (cuantas) => {
                ctx.fillStyle = '#eef5ff';
                [...MARCA].slice(0, cuantas).forEach((ch, i) => LETRAS[ch].forEach((f, y) => [...f].forEach((b, x) => {
                    if (b === '1') ctx.fillRect(marcaX + (i * 6 + x) * px, marcaY + y * px, px, px);
                })));
            };
            const pixelado = document.createElement('canvas');
            const pintarLogoPixelado = (tam) => {
                const anc = Math.max(2, Math.round(ladoLogo * 1.049 / tam)), alt = Math.max(2, Math.round(ladoLogo / tam));
                pixelado.width = anc; pixelado.height = alt;
                pixelado.getContext('2d').drawImage(logo, 0, 0, anc, alt);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(pixelado, logoX, logoY, ladoLogo * 1.049, ladoLogo);
                ctx.imageSmoothingEnabled = true;
            };
            const T_ASCII = 850, T_PIXEL = 1300, T_MARCA = 1900, T_FIN = 2450;
            // El reloj avanza por fotogramas pintados: si la carga bloquea la página, la intro no se salta partes
            let tiempo = 0, previo = 0;
            let saltar = false, disuelve = 0, terminado = false;
            const tile = document.createElement('canvas');
            tile.width = tile.height = 4;
            const ESCALA = 7;
            const terminar = () => {
                if (terminado) return;
                terminado = true;
                raiz.classList.remove('intro-marca');
                c.remove();
                ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => removeEventListener(ev, pedirSalto));
            };
            const pedirSalto = () => { saltar = true; };
            ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, pedirSalto, { passive: true }));
            const cuadro = (ahora) => {
                if (terminado) return;
                tiempo += previo ? Math.min(ahora - previo, 40) : 0;
                previo = ahora;
                if (saltar && tiempo <= T_MARCA) tiempo = T_MARCA + 1;
                const t = tiempo;
                if (t <= T_MARCA) {
                    ctx.fillStyle = FONDO;
                    ctx.fillRect(0, 0, w, h);
                }
                if (t < T_PIXEL) {
                    // Caracteres al azar que se van apagando; los que caen en el logo se quedan y se aclaran
                    const avance = limitar(t / T_ASCII);
                    for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) {
                        const k = j * col + i;
                        const dentro = logoListo && mascara[k];
                        if (!dentro && azar[k] < avance * 1.15) continue;
                        const encendida = dentro && azar[k] < avance * 1.3;
                        const g = encendida ? RAMPA.length - 1 - (k % 2) : (glifoAzar[k] + Math.floor(t / 90)) % (RAMPA.length - 1) + 1;
                        ctx.globalAlpha = encendida ? limitar(1 - (t - T_ASCII) / (T_PIXEL - T_ASCII)) : .32 * (1 - avance);
                        ctx.drawImage(encendida ? atlasClaro : atlas, g * AN, 0, AN, AL, i * AN, j * AL, AN, AL);
                    }
                    ctx.globalAlpha = 1;
                }
                if (logoListo && t >= T_ASCII && t <= T_MARCA) {
                    const f = limitar((t - T_ASCII) / (T_PIXEL - T_ASCII));
                    const pasos = [32, 24, 16, 12, 8, 6, 4, 2];
                    if (f < 1) pintarLogoPixelado(pasos[Math.min(pasos.length - 1, Math.floor(f * pasos.length))]);
                    else ctx.drawImage(logo, logoX, logoY, ladoLogo * 1.049, ladoLogo);
                }
                if (t >= T_PIXEL && t <= T_MARCA) pintarMarca(Math.ceil(limitar((t - T_PIXEL) / (T_MARCA - T_PIXEL - 120)) * MARCA.length));
                if (t > T_MARCA) {
                    // Disolución: cada nivel de Bayer borra más celdas y deja ver la página
                    raiz.classList.remove('intro-marca');
                    if (!disuelve) { disuelve = t; if (logoListo) ctx.drawImage(logo, logoX, logoY, ladoLogo * 1.049, ladoLogo); pintarMarca(MARCA.length); }
                    const nivel = Math.ceil(limitar((t - disuelve) / (saltar ? 240 : T_FIN - T_MARCA)) * 16);
                    const tc = tile.getContext('2d');
                    tc.clearRect(0, 0, 4, 4);
                    tc.fillStyle = '#000';
                    BAYER.forEach((b, k) => { if (b < nivel) tc.fillRect(k % 4, Math.floor(k / 4), 1, 1); });
                    const patron = ctx.createPattern(tile, 'repeat');
                    patron.setTransform(new DOMMatrix().scale(ESCALA));
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.fillStyle = patron;
                    ctx.fillRect(0, 0, w, h);
                    ctx.globalCompositeOperation = 'source-over';
                    if (nivel >= 16) return terminar();
                }
                requestAnimationFrame(cuadro);
            };
            requestAnimationFrame(cuadro);
            setTimeout(terminar, 6000);
        }
    }

    // Para quien abra la consola
    console.log('%c\n   ▄▄▄▄   ██\n  ▐█▓▓█▌  ██\n  ▐█▓▓█▌  ██▄▄▄\n   ▀▀▀▀   ▀▀▀▀▀  Ollin-Tep Software · ollin-tep.com\n', 'color:#6ea2ff;font-family:monospace');
})();
