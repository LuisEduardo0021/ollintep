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
        plan.addEventListener('pointermove', (e) => {
            const r = plan.getBoundingClientRect();
            foil.style.setProperty('--fx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
            foil.style.setProperty('--fy', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
        });
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

    // --- ARTE ASCII (Diagmind): la placa real de la captura de diagnóstico, en caracteres, con un barrido de escaneo
    document.querySelectorAll('[data-ascii]').forEach(caja => {
        if (!escritorio || ligero()) return caja.remove();
        const img = new Image();
        img.onload = () => {
            const c = lienzo('ascii-lienzo');
            caja.append(c);
            const ctx = c.getContext('2d');
            const AN = 8, AL = 14, RAMPA = ' .:-=+*#%@';
            const col = Math.ceil(caja.clientWidth / AN), fil = Math.ceil(caja.clientHeight / AL);
            c.width = col * AN; c.height = fil * AL;
            // Muestreo tipo «cover», con el contraste estirado porque la captura es muy oscura
            const m = document.createElement('canvas');
            m.width = col; m.height = fil;
            const mc = m.getContext('2d', { willReadFrequently: true });
            const esc = Math.max(col * (AN / AL) / img.width, fil / img.height);
            const vw = col / (esc / (AN / AL) * 1), vh = fil / esc;
            mc.drawImage(img, (img.width - vw) / 2, (img.height - vh) / 2, vw, vh, 0, 0, col, fil);
            const datos = mc.getImageData(0, 0, col, fil).data;
            const lum = new Float32Array(col * fil);
            let min = 1, max = 0;
            lum.forEach((_, i) => { const v = (datos[i * 4] * .3 + datos[i * 4 + 1] * .59 + datos[i * 4 + 2] * .11) / 255; lum[i] = v; min = Math.min(min, v); max = Math.max(max, v); });
            lum.forEach((v, i) => { lum[i] = Math.pow((v - min) / Math.max(max - min, .01), .42); });
            // Atlas de glifos para no llamar a fillText miles de veces por fotograma
            const atlas = document.createElement('canvas');
            atlas.width = AN * RAMPA.length; atlas.height = AL;
            const ac = atlas.getContext('2d');
            ac.font = '13px ui-monospace, Menlo, Consolas, monospace';
            ac.textBaseline = 'top';
            ac.fillStyle = '#22e1f0';
            [...RAMPA].forEach((ch, i) => ac.fillText(ch, i * AN, 0));
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
            dibujar(0);
            bucle(caja, 14, dibujar);
        };
        img.src = new URL('../resources/screenshots/diagmind-pcb.webp', base).href;
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
        const programar = () => setTimeout(() => { if (!document.hidden && el.getBoundingClientRect().bottom > 0) rafaga(); programar(); }, 4500 + Math.random() * 4500);
        setTimeout(rafaga, 1400);
        programar();
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

    // --- DITHERING (todas las páginas): banda de transición antes del pie, con matriz de Bayer 4×4. Es una imagen fija.
    const pie = document.querySelector('.footer');
    if (pie) {
        const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
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
        pie.before(banda);
    }
})();
