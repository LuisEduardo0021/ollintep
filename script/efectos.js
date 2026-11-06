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
        // A media resolución: son formas suaves, no se nota, y cuesta la cuarta parte
        const medir = () => { c.width = Math.ceil(caja.clientWidth / 2); c.height = Math.ceil(caja.clientHeight / 2); gl.viewport(0, 0, c.width, c.height); };
        medir();
        addEventListener('resize', medir);
        const pos = new Float32Array(27);
        let cursorX = -1, cursorY = -1, cx = 0, cy = 0;
        const zona = caja.closest('section') || caja;
        zona.addEventListener('pointermove', (ev) => {
            const r = caja.getBoundingClientRect();
            if (cursorX < 0) { cx = (ev.clientX - r.left) / 2; cy = (r.bottom - ev.clientY) / 2; }
            cursorX = (ev.clientX - r.left) / 2;
            cursorY = (r.bottom - ev.clientY) / 2;   // WebGL cuenta desde abajo y el lienzo va a media resolución
        }, { passive: true });
        zona.addEventListener('pointerleave', () => { cursorX = cursorY = -1; });
        bucle(caja, 50, (t) => {
            const r = caja.getBoundingClientRect();
            const p = limitar((innerHeight * .92 - r.top) / (innerHeight * .55));
            const e = p * p * (3 - 2 * p);
            const w = c.width, h = c.height;
            // El cursor las atrae con inercia
            cx += (cursorX - cx) * .07;
            cy += (cursorY - cy) * .07;
            for (let i = 0; i < 9; i++) {
                // Separadas: cada gota vaga por su cuenta y a ratos toca a sus vecinas
                const ox = w * (.08 + i * .105) + Math.sin(t * .8 + i * 2.1) * w * .045 + Math.cos(t * .37 + i) * w * .02;
                const oy = h / 2 + Math.sin(t * 1.25 + i * 1.7) * h * .2;
                // Fundidas: siguen orbitando dentro de la masa, que se deforma y a veces suelta una gota
                const ang = t * (.55 + i * .06) * (i % 2 ? 1 : -1) + i * .7;
                const salida = Math.pow(Math.max(0, Math.sin(t * .45 + i * 1.1)), 8);
                const radio = h * (.13 + Math.sin(t * .8 + i) * .05 + salida * .1);
                const mx = w / 2 + Math.cos(ang) * radio * 2.1, my = h / 2 + Math.sin(ang) * radio * .85;
                const ax = (cx - (ox + (mx - ox) * e)) * .22, ay = (cy - (oy + (my - oy) * e)) * .22;
                pos[i * 3] = ox + (mx - ox) * e + (cursorX < 0 ? 0 : ax);
                pos[i * 3 + 1] = limitar(oy + (my - oy) * e + (cursorX < 0 ? 0 : ay), h * .3, h * .7);
                pos[i * 3 + 2] = (h * .125) * (1 - e * .3) + Math.sin(t * 1.6 + i * 2) * h * .014;
            }
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform3fv(uB, pos);
            gl.uniform1f(uM, limitar((e - .72) / .28) * .62);
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
            // Al entrar en pantalla, la imagen se descifra: caracteres al azar que van cayendo en su sitio
            const orden = new Float32Array(col * fil).map(() => Math.random());
            let inicio = null;
            const dibujar = (t) => {
                ctx.clearRect(0, 0, c.width, c.height);
                const barrido = ((t * .16) % 1.3) * col;
                if (inicio === null && t >= 0) inicio = t;
                const hecho = inicio === null ? 1 : limitar((t - inicio) / 1.5);
                for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) {
                    if (orden[j * col + i] > hecho) {
                        ctx.drawImage(atlas, (1 + Math.floor(Math.random() * (RAMPA.length - 1))) * AN, 0, AN, AL, i * AN, j * AL, AN, AL);
                        continue;
                    }
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

    // --- ASCII ANIMADO: una escena por página, calculada celda a celda. data-ascii-anim = nombre · data-color = color.
    // En móvil o con movimiento reducido queda un fotograma fijo; en modo ligero no se crea.
    const azarDe = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
    const ESCENAS = {
        // Portada, servicio técnico: un gabinete de PC abierto en mantenimiento, con ventiladores, memorias y un barrido de diagnóstico
        gabinete: (v, col, fil, t) => {
            const ASPECTO = 1.75;   // las celdas son más altas que anchas
            const alto = fil - 1, ancho = Math.min(col - 1, Math.round(alto * ASPECTO * .95));
            const x0 = Math.floor((col - ancho) / 2), y0 = 0;
            const X = (u) => x0 + Math.round(u * ancho), Y = (w) => y0 + Math.round(w * alto);
            const pon = (i, j, n) => { if (i >= 0 && i < col && j >= 0 && j < fil) v[j * col + i] = Math.max(v[j * col + i], n); };
            const marco = (a, b, c, d, n) => {
                for (let i = X(a); i <= X(c); i++) { pon(i, Y(b), n); pon(i, Y(d), n); }
                for (let j = Y(b); j <= Y(d); j++) { pon(X(a), j, n); pon(X(c), j, n); }
            };
            const relleno = (a, b, c, d, n) => { for (let j = Y(b); j <= Y(d); j++) for (let i = X(a); i <= X(c); i++) pon(i, j, n); };
            // Aspas que giran: se calcula el ángulo de cada celda respecto al centro
            const ventilador = (u, w, r, vel, aspas) => {
                const cx = X(u), cy = Y(w);
                for (let j = cy - r - 1; j <= cy + r + 1; j++) for (let i = cx - Math.ceil((r + 1) * ASPECTO); i <= cx + Math.ceil((r + 1) * ASPECTO); i++) {
                    const dx = (i - cx) / ASPECTO, dy = j - cy, d = Math.hypot(dx, dy);
                    if (d > r + .7) continue;
                    if (d > r - .4) pon(i, j, .85);
                    else if (d < r * .24) pon(i, j, 1);
                    else {
                        const a = Math.atan2(dy, dx) - t * vel + d * .28;
                        const f = Math.cos(a * aspas);
                        pon(i, j, f > .25 ? .78 : .1);
                    }
                }
            };
            marco(0, 0, 1, 1, .95);                         // gabinete
                        ventilador(.2, .25, Math.max(3, Math.round(alto * .18)), 6, 3);   // ventilador trasero
            // Memorias RAM, con actividad que parpadea
            for (let k = 0; k < 4; k++) {
                const a = .43 + k * .055;
                for (let j = Y(.1); j <= Y(.42); j++) {
                    const activo = azarDe(k * 11 + j * 3 + Math.floor(t * 7)) > .45;
                    pon(X(a), j, activo ? 1 : .35);
                }
            }
            // Unidades de disco, con su luz
            for (let k = 0; k < 3; k++) {
                const b = .1 + k * .12;
                marco(.72, b, .93, b + .08, .6);
                pon(X(.9), Y(b + .04), azarDe(k + Math.floor(t * 4)) > .5 ? 1 : .2);
            }
            // Tarjeta gráfica, con dos ventiladores
            marco(.08, .52, .78, .74, .7);
            ventilador(.25, .63, Math.max(2, Math.round(alto * .085)), -8, 3);
            ventilador(.6, .63, Math.max(2, Math.round(alto * .085)), -8, 3);
            // Fuente de poder, con su rejilla
            marco(.08, .8, .4, .94, .65);
            for (let i = X(.1); i < X(.38); i += 2) pon(i, Y(.87), .4);
            // Tornillos que se aprietan: el destornillador entra y sale del de abajo a la derecha
            const entra = (Math.sin(t * 1.4) + 1) / 2;
            const punta = X(.64) + Math.round(entra * ancho * .12);
            for (let i = punta; i < x0 + ancho + 6; i++) pon(i, Y(.87), i < punta + 3 ? 1 : i < X(.86) + Math.round(entra * ancho * .12) ? .55 : .85);
            pon(X(.62), Y(.87), .9);
            // Barrido de diagnóstico de arriba abajo
            const barrido = (t * .22) % 2.2;
            if (barrido <= 1) { const j = Y(barrido); for (let i = X(0) + 1; i < X(1); i++) v[j * col + i] = Math.max(v[j * col + i], .4); }
        },
        // Portada, diseño: un logo que se traza con la pluma, nodo a nodo, con sus manejadores; al cerrarse se rellena y vuelve a empezar
        trazo: (v, col, fil, t, foco) => {
            const ASPECTO = 1.75;
            const alto = fil - 2, ancho = Math.min(col - 2, Math.round(alto * ASPECTO));
            const x0 = Math.floor((col - ancho) / 2), y0 = 1;
            const X = (u) => x0 + u * ancho, Y = (w) => y0 + w * alto;
            const pon = (i, j, n) => { i = Math.round(i); j = Math.round(j); if (i >= 0 && i < col && j >= 0 && j < fil) v[j * col + i] = Math.max(v[j * col + i], n); };
            const linea = (a, b, c, d, n, paso = 1) => {
                const k = Math.max(Math.abs(X(c) - X(a)), Math.abs(Y(d) - Y(b)), 1);
                for (let q = 0; q <= k; q += paso) pon(X(a + (c - a) * q / k), Y(b + (d - b) * q / k), n);
            };
            // Segmentos cúbicos: [inicio, control 1, control 2, fin], en una gota con un corte en diagonal
            const SEG = [
                [[.5, .04], [.8, .04], [.97, .42], [.9, .62]],
                [[.9, .62], [.82, .9], [.6, .97], [.45, .95]],
                [[.45, .95], [.2, .92], [.04, .7], [.1, .5]],
                [[.1, .5], [.16, .24], [.3, .04], [.5, .04]],
            ];
            const bez = (g, q) => { const m = 1 - q; return [0, 1].map(e => m * m * m * g[0][e] + 3 * m * m * q * g[1][e] + 3 * m * q * q * g[2][e] + q * q * q * g[3][e]); };
            const N = 90, ciclo = 9, f = (t % ciclo) / ciclo;            // 0-.62 trazo, .62-.85 relleno, después pausa
            const avance = Math.min(1, f / .62) * SEG.length;
            // Relleno con trama que crece desde abajo cuando la figura ya está cerrada
            if (f > .62) {
                const nivel = Math.min(1, (f - .62) / .2);
                const pol = SEG.flatMap(g => Array.from({ length: 24 }, (_, q) => bez(g, q / 24)));
                for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) {
                    const u = (i - x0) / ancho, w = (j - y0) / alto;
                    if (w < 1 - nivel * 1.05) continue;
                    let dentro = false;
                    for (let a = 0, b = pol.length - 1; a < pol.length; b = a++) {
                        if ((pol[a][1] > w) !== (pol[b][1] > w) && u < (pol[b][0] - pol[a][0]) * (w - pol[a][1]) / (pol[b][1] - pol[a][1]) + pol[a][0]) dentro = !dentro;
                    }
                    if (dentro) pon(i, j, ((i + j) % 3 === 0) ? .5 : .22);
                }
                // El corte en diagonal que convierte la gota en marca
                for (let q = 0; q <= 1; q += .01) { const u = .3 + .44 * q, w = .78 - .48 * q; const i = Math.round(X(u)), j = Math.round(Y(w)); if (i >= 0 && i < col && j >= 0 && j < fil) v[j * col + i] = .02; }
            }
            // Foco: el servicio bajo el cursor se dibuja en la escena
            const k = foco.k;
            if (foco.n === 'logotipos') {
                // Construcción: círculos guía y todos los manejadores a la vista
                [[.5, .5, .46], [.62, .38, .28], [.36, .66, .2]].forEach(([u, w, r]) => {
                    for (let a = 0; a < 6.283; a += .035) pon(X(u + Math.cos(a) * r * alto / ancho * ASPECTO * .55), Y(w + Math.sin(a) * r), .3 * k);
                });
                linea(0, 1, 1, 0, .2 * k, 3); linea(0, .5, 1, .5, .14 * k, 4); linea(.5, 0, .5, 1, .14 * k, 4);
                SEG.forEach(g => {
                    linea(g[0][0], g[0][1], g[1][0], g[1][1], .45 * k, 2); linea(g[3][0], g[3][1], g[2][0], g[2][1], .45 * k, 2);
                    [g[1], g[2]].forEach(([u, w]) => pon(X(u), Y(w), k));
                });
            } else if (foco.n === 'identidad' || foco.n === 'publicidad') {
                const pol = SEG.flatMap(g => Array.from({ length: 24 }, (_, q) => bez(g, q / 24)));
                const escala = foco.n === 'publicidad' ? 1 + Math.sin(t * 5) * .04 * k : 1;
                for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) {
                    const u = .5 + ((i - x0) / ancho - .5) / escala, w = .5 + ((j - y0) / alto - .5) / escala;
                    let dentro = false;
                    for (let a = 0, b = pol.length - 1; a < pol.length; b = a++) {
                        if ((pol[a][1] > w) !== (pol[b][1] > w) && u < (pol[b][0] - pol[a][0]) * (w - pol[a][1]) / (pol[b][1] - pol[a][1]) + pol[a][0]) dentro = !dentro;
                    }
                    // Identidad: franjas de la paleta; publicidad: la marca llena que late
                    if (dentro) pon(i, j, (foco.n === 'identidad' ? [.25, .45, .65, .85][Math.floor(u * 4 + t * .6) & 3] : .6) * k);
                }
                if (foco.n === 'publicidad') {
                    // Rayos que salen de la marca, como en un cartel
                    // Rayos continuos con un pulso de luz que sale hacia fuera
                    const pulso = .54 + ((t * .7) % 1) * .4;
                    for (let r = 0; r < 14; r++) {
                        const a = r / 14 * 6.283 + .11;
                        for (let d = .54; d <= .95; d += .006) {
                            const n = Math.max(.25, 1 - Math.abs(d - pulso) * 12);
                            pon(X(.5 + Math.cos(a) * d * alto * ASPECTO / ancho), Y(.5 + Math.sin(a) * d), n * k);
                        }
                    }
                }
            } else if (foco.n === 'interfaces') {
                // Una ventana de app alrededor: barra con tres botones, menú lateral y tarjetas
                const m = (a, b, c, d, n) => { linea(a, b, c, b, n); linea(a, d, c, d, n); linea(a, b, a, d, n); linea(c, b, c, d, n); };
                const xa = -.22, xb = 1.22;
                const U = (q) => xa + (xb - xa) * q;
                m(U(0), -.02, U(1), 1.02, .7 * k);
                linea(U(0), .1, U(1), .1, .5 * k);
                [.02, .04, .06].forEach(q => pon(X(U(q)), Y(.05), k));
                linea(U(.18), .1, U(.18), 1.02, .4 * k);
                for (let r = 0; r < 6; r++) linea(U(.03), .2 + r * .12, U(.03 + .1 * (.6 + azarDe(r) * .4)), .2 + r * .12, .35 * k, 1);
                m(U(.82), .2, U(.97), .45, .4 * k); m(U(.82), .55, U(.97), .9, .4 * k);
            }
            // Guía tenue de lo que falta y trazo firme de lo hecho
            SEG.forEach((g, k) => {
                for (let q = 0; q <= N; q++) {
                    const [u, w] = bez(g, q / N);
                    const hecho = k + q / N <= avance;
                    if (hecho) pon(X(u), Y(w), 1); else if (q % 3 === 0) pon(X(u), Y(w), .13);
                }
            });
            // Nodos: los ya puestos como cuadros; en el segmento activo, sus manejadores
            const activo = Math.min(SEG.length - 1, Math.floor(avance));
            SEG.forEach((g, k) => {
                if (k > avance) return;
                const [u, w] = g[0];
                for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) pon(X(u) + di, Y(w) + dj, di || dj ? .85 : .2);
            });
            if (f < .62) {
                const g = SEG[activo];
                linea(g[0][0], g[0][1], g[1][0], g[1][1], .4, 2);
                linea(g[3][0], g[3][1], g[2][0], g[2][1], .4, 2);
                [g[1], g[2]].forEach(([u, w]) => { pon(X(u), Y(w), 1); pon(X(u) + 1, Y(w), .7); pon(X(u) - 1, Y(w), .7); });
                // La pluma en la punta del trazo
                const [pu, pw] = bez(g, avance - activo);
                for (let d = 0; d < 6; d++) pon(X(pu) + d * 1.4 + 1, Y(pw) - d * .8 - 1, d < 2 ? 1 : .65);
            }
        },
        // Portada, redes: router, switch y tres VLAN; los paquetes viajan sin cruzar de una VLAN a otra
        red: (v, col, fil, t, foco) => {
            const pon = (i, j, n) => { i = Math.round(i); j = Math.round(j); if (i >= 0 && i < col && j >= 0 && j < fil) v[j * col + i] = Math.max(v[j * col + i], n); };
            const P = (u, w) => [u * (col - 1), w * (fil - 1)];
            const tramo = (a, b, n, paso = 1) => {
                const k = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
                for (let q = 0; q <= k; q += paso) pon(a[0] + (b[0] - a[0]) * q / k, a[1] + (b[1] - a[1]) * q / k, n);
            };
            const caja = (c, an, al, n, borde = n) => {
                for (let i = -an; i <= an; i++) for (let j = -al; j <= al; j++) pon(c[0] + i, c[1] + j, Math.abs(i) === an || Math.abs(j) === al ? borde : n);
            };
            const nube = P(.5, .06), router = P(.5, .24), sw = P(.5, .46);
            const grupos = [.17, .5, .83].map((u, g) => ({ u, hosts: [-.1, 0, .1].map(d => P(u + d, .86)), g }));
            // Enlaces: la subida a internet punteada, el resto continuo
            tramo(nube, router, .35, 2);
            tramo(router, sw, .5);
            grupos.forEach(G => {
                const bajada = P(G.u, .66);
                tramo(sw, bajada, .45);
                G.hosts.forEach(h => { tramo(bajada, [h[0], bajada[1]], .45); tramo([h[0], bajada[1]], h, .45); });
                // Recuadro punteado de la VLAN
                const a = P(G.u - .15, .6), b = P(G.u + .15, .97);
                for (let i = a[0]; i <= b[0]; i += 2) { pon(i, a[1], .3); pon(i, b[1], .3); }
                for (let j = a[1]; j <= b[1]; j += 2) { pon(a[0], j, .3); pon(b[0], j, .3); }
            });
            // Equipos: el switch con sus puertos parpadeando
            caja(nube, 4, 1, .25, .6);
            caja(router, 3, 1, .3, .9);
            caja(sw, Math.round(col * .2), 1, .2, .9);
            for (let k = 0; k < 12; k++) pon(sw[0] - col * .18 + k * col * .033, sw[1], azarDe(k * 5 + Math.floor(t * 6)) > .5 ? 1 : .35);
            grupos.forEach(G => G.hosts.forEach((h, k) => caja(h, 1, 1, azarDe(G.g * 9 + k + Math.floor(t * 2)) > .7 ? .9 : .4, .75)));
            // Foco: el servicio bajo el cursor se ilumina en la topología
            const k = foco.k;
            if (foco.n === 'planos') {
                for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) if (j % 4 === 0 || i % 8 === 0) pon(i, j, .16 * k);
                const r = Math.round(((t * .5) % 1) * fil);
                for (let i = 0; i < col; i++) pon(i, r, .5 * k);
            } else if (foco.n === 'servidores') {
                caja(router, 3, 1, .85 * k, 1); caja(nube, 4, 1, .5 * k, 1);
                // Rack junto al router, con unidades que se encienden
                for (let u = 0; u < 4; u++) caja([router[0] + 12, router[1] - 3 + u * 2], 4, 0, azarDe(u + Math.floor(t * 5)) > .4 ? .9 * k : .3 * k);
            } else if (foco.n === 'vlans') {
                grupos.forEach((G, g) => {
                    const a = P(G.u - .15, .6), b = P(G.u + .15, .97);
                    for (let j = a[1]; j <= b[1]; j++) for (let i = a[0]; i <= b[0]; i++) {
                        const borde = j === a[1] || j === b[1] || i === a[0] || i === b[0];
                        pon(i, j, borde ? k : ((i + j + g) % (3 + g) === 0 ? .35 : .08) * k);
                    }
                });
            } else if (foco.n === 'switch') {
                caja(sw, Math.round(col * .2), 1, .45 * k, 1);
                for (let n = 0; n < 12; n++) pon(sw[0] - col * .18 + n * col * .033, sw[1], azarDe(n * 5 + Math.floor(t * 22)) > .4 ? 1 : .3);
            } else if (foco.n === 'firewall') {
                // Un muro entre internet y el router; lo que llega de fuera rebota
                const yw = Math.round((nube[1] + router[1]) / 2);
                for (let i = -9; i <= 9; i++) { pon(router[0] + i, yw, (i + 30) % 3 ? .9 * k : .4 * k); pon(router[0] + i, yw - 1, (i + 31) % 3 ? .7 * k : .3 * k); }
                for (let n = 0; n < 3; n++) {
                    const q = (t * .8 + n / 3) % 1, x = router[0] - 6 + n * 6;
                    const y = q < .5 ? nube[1] + 1 + (yw - 2 - nube[1]) * q * 2 : yw - 2 - (yw - 2 - nube[1]) * (q - .5) * 2;
                    pon(x, y, k);
                }
            } else if (foco.n === 'wifi') {
                grupos.forEach((G, g) => {
                    // Un punto de acceso por VLAN; la cobertura baja en ondas hacia sus equipos
                    const c = P(G.u, .62);
                    caja(c, 2, 0, k, k);
                    for (let o = 0; o < 3; o++) {
                        const r = 1 + ((t * 4 + o * 2.4 + g) % 7);
                        for (let a = Math.PI * .2; a < Math.PI * .8; a += .03) pon(c[0] + Math.cos(a) * r * 1.75, c[1] + Math.sin(a) * r, (1 - r / 8) * k);
                    }
                });
            }
            // Paquetes: cada uno hace host → switch → host de su misma VLAN; de vez en cuando uno sube al router
            const ruta = (pts, q) => {
                const largos = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
                let d = q * largos.reduce((a, b) => a + b, 0);
                for (let k = 0; k < largos.length; k++) {
                    if (d <= largos[k]) { const r = d / largos[k]; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * r, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * r]; }
                    d -= largos[k];
                }
                return pts[pts.length - 1];
            };
            for (let n = 0; n < 9; n++) {
                const G = grupos[n % 3], vuelta = Math.floor(t * .35 + azarDe(n) * 7);
                const q = (t * .35 + azarDe(n) * 7) % 1;
                const de = G.hosts[Math.floor(azarDe(n * 3 + vuelta) * 3)];
                const sube = foco.n !== 'vlans' && azarDe(n * 7 + vuelta) > (foco.n === 'servidores' ? .25 : .7);
                const a = G.hosts[Math.floor(azarDe(n * 5 + vuelta) * 3)];
                const bajada = P(G.u, .66);
                const pts = sube
                    ? [de, [de[0], bajada[1]], bajada, sw, router, nube]
                    : [de, [de[0], bajada[1]], bajada, sw, bajada, [a[0], bajada[1]], a];
                const [x, y] = ruta(pts, q);
                pon(x, y, 1); pon(x + 1, y, .8); pon(x - 1, y, .8);
            }
        },
        // Agro-Cria: el agua de riego, con superficie y reflejos
        olas: (v, col, fil, t) => {
            for (let i = 0; i < col; i++) {
                const h = fil * .48 + Math.sin(i * .11 + t * 1.3) * fil * .17 + Math.sin(i * .037 - t * .7) * fil * .14;
                for (let j = 0; j < fil; j++) {
                    const d = j - h;
                    if (Math.abs(d) < 1.1) v[j * col + i] = 1;
                    else if (d > 0) v[j * col + i] = limitar(.5 - d / fil + Math.sin(i * .3 + j * .9 - t * 2) * .22, .08, .7);
                }
            }
        },
        // Diagmind: osciloscopio con tres señales y un pulso que recorre la pantalla
        osciloscopio: (v, col, fil, t) => {
            const cabeza = (t * 26) % col;
            for (let i = 0; i < col; i++) {
                const atras = (cabeza - i + col) % col;
                const brillo = limitar(1 - atras / (col * .75), .12, 1);
                const f = (i + t * 6) % 42;
                const pulso = f < 2 ? -f * 1.8 : f < 5 ? (f - 3.5) * 3 : f < 7 ? (7 - f) * -1.2 : 0;
                const y1 = fil * .3 + pulso;
                const y2 = fil * .62 + Math.sin(i * .16 + t * 2) * fil * .1;
                const y3 = fil * .84 + Math.sin(i * .5 - t * 3) * Math.sin(i * .04 + t) * fil * .09;
                for (const y of [y1, y2, y3]) {
                    const j = Math.round(y);
                    if (j >= 0 && j < fil) v[j * col + i] = Math.max(v[j * col + i], brillo);
                }
                if (i % 14 === 0) for (let j = 0; j < fil; j += 2) v[j * col + i] = Math.max(v[j * col + i], .14);
            }
        },
        // ActaPro: un acta que se escribe sola, línea a línea, y vuelve a empezar
        acta: (v, col, fil, t) => {
            const COLUMNAS = Math.max(1, Math.floor(col / 62));
            const anchoCol = Math.floor(col / COLUMNAS);
            const avance = (t * 44) % (anchoCol * .78 * fil * COLUMNAS * .75 + 90);
            let escrito = 0;
            for (let c = 0; c < COLUMNAS; c++) for (let j = 1; j < fil; j += 2) {
                const largo = Math.floor(anchoCol * (.35 + azarDe(c * 31 + j) * .5));
                for (let i = 0; i < largo; i++) {
                    if (escrito++ > avance) { if (escrito - avance < 3) v[j * col + c * anchoCol + 3 + i] = 1; continue; }
                    const palabra = azarDe(c * 7 + j * 3 + Math.floor(i / 6)) > .82 && i % 6 === 5;
                    if (!palabra) v[j * col + c * anchoCol + 3 + i] = .32 + azarDe(c + j * 91 + i * 13) * .4;
                }
            }
        },
        // Centzontle: el canto del pájaro, como un ecualizador que respira por frases
        canto: (v, col, fil, t) => {
            const frase = Math.pow(Math.max(0, Math.sin(t * .9)), .5) * .5 + .5;
            for (let i = 0; i < col; i += 3) {
                const n = i / col;
                const alto = frase * fil * .5 * (.35 + .65 * Math.abs(Math.sin(n * 19 + t * 3.1) * Math.sin(n * 7 - t * 1.7))) * Math.sin(n * Math.PI);
                for (let j = 0; j < fil; j++) {
                    const d = Math.abs(j - fil / 2);
                    if (d <= alto) { const g = d > alto - 1 ? 1 : .55 - d / fil; v[j * col + i] = g; v[j * col + i + 1] = g; }
                }
            }
        },
        // Página 404: caracteres que caen, como un sistema que se ha perdido
        lluvia: (v, col, fil, t) => {
            for (let i = 0; i < col; i += 2) {
                const vel = 5 + azarDe(i) * 12, largo = 5 + azarDe(i + 9) * 16;
                const cabeza = (t * vel + azarDe(i + 3) * 200) % (fil + largo);
                for (let j = 0; j < fil; j++) {
                    const d = cabeza - j;
                    if (d >= 0 && d < largo) v[j * col + i] = d < 1 ? 1 : .55 * (1 - d / largo);
                }
            }
        },
    };
    document.querySelectorAll('[data-ascii-anim]').forEach(caja => {
        const escena = ESCENAS[caja.dataset.asciiAnim];
        if (!escena || ligero()) return caja.querySelector('.paleta') ? undefined : caja.remove();   // la paleta de Diseño es CSS: se queda
        const c = lienzo('ascii-lienzo');
        caja.append(c);
        const ctx = c.getContext('2d');
        const fina = caja.dataset.celda === 'fina';
        const AN = fina ? 5 : escritorio ? 8 : 6, AL = fina ? 9 : escritorio ? 14 : 10;
        const col = Math.ceil(caja.clientWidth / AN), fil = Math.ceil(caja.clientHeight / AL);
        if (!col || !fil) return;
        c.width = col * AN; c.height = fil * AL;
        const atlas = crearAtlas(caja.dataset.color || '#6ea2ff', AN, AL);
        const v = new Float32Array(col * fil);
        const dibujar = (t) => {
            v.fill(0);
            const desde = +caja.dataset.focoT || 0;
            escena(v, col, fil, t, { n: caja.dataset.foco || '', k: Math.min(1, Math.max(0, (t - desde) / .35)) });
            ctx.clearRect(0, 0, c.width, c.height);
            for (let j = 0; j < fil; j++) for (let i = 0; i < col; i++) {
                const n = v[j * col + i];
                if (n <= .02) continue;
                const g = Math.min(RAMPA.length - 1, 1 + Math.floor(n * (RAMPA.length - 1)));
                ctx.drawImage(atlas, g * AN, 0, AN, AL, i * AN, j * AL, AN, AL);
            }
        };
        dibujar(4);
        if (escritorio) bucle(caja, 20, dibujar);
        // Servicios que se dibujan: al pasar el cursor por uno (o enfocarlo), la escena de su sección lo muestra
        const seccion = caja.closest('section');
        seccion?.querySelectorAll('.service-list li[data-foco]').forEach(li => {
            const pon = () => { caja.dataset.foco = li.dataset.foco; caja.dataset.focoT = performance.now() / 1000; };
            const quita = () => { if (caja.dataset.foco === li.dataset.foco) delete caja.dataset.foco; };
            li.addEventListener('pointerenter', pon);
            li.addEventListener('pointerleave', quita);
        });
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
    const COLORES_PIXEL = { g: '#94a3b8', d: '#475569', w: '#f1f5f9', l: '#e2e8f0', k: '#0f172a', p: '#8a5a33', a: '#ff7a2e', b: '#6ea2ff', r: '#ef4444', v: '#34d399', o: '#059669', c: '#22e1f0', n: '#1e293b', y: '#fde047', J: '#e0a040', K: '#3a2a1c', T: '#8fbf8a', U: '#4f7d4a', M: '#9aa7b8', Z: '#3d4a5e', B: '#3b82f6', P: '#ec4899', Q: '#22d3ee', F: '#f97316', S: '#c9a26b', V: '#9a6b3f', N: '#2f9e6b', L: '#7fd6a4', E: '#b05cff' };
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
        // Región: fauna de Nayarit
        jaguar: [
            columna(['................', '...............K', '..JJ...........K', '.JJJJ.........K.', '.JKJJJJJKJJKJJK.', 'JJJJJKJJJJKJJKJ.', '.JJJJJJKJJJJKJJ.', '...JKJJJJKJJJJJ.', '...JJJJJJJJJJJJ.', '...JJ..JJ.JJ.JJ.', '...JJ..JJ.JJ.JJ.', '...KK..KK.KK.KK.']),
            columna(['................', '..............K.', '..JJ..........K.', '.JJJJ.........K.', '.JKJJJJJKJJKJJK.', 'JJJJJKJJJJKJJKJ.', '.JJJJJJKJJJJKJJ.', '...JKJJJJKJJJJJ.', '...JJJJJJJJJJJJ.', '....JJ.JJ...JJ.J', '....JJ.JJ..JJ..J', '....KK.KK..KK..K']),
        ],
        cocodrilo: [
            columna([VACIO, VACIO, VACIO, VACIO, VACIO, '....U.U.U.U.....', '...UUUUUUUUUU...', '.TUKUUUUUUUUUUU.', 'TTTTUUUUUUUUUUUU', 'TTTTTUUUUUUUUU.U', '...U.UU..UU.....', '...U.UU..UU.....']),
            columna([VACIO, VACIO, VACIO, VACIO, 'TTT.............', '.TTTU.U.U.U.....', '...UUUUUUUUUU...', '..UKUUUUUUUUUUU.', '.TTTUUUUUUUUUUUU', 'TTTTTUUUUUUUUU.U', '...U.UU..UU.....', '...U.UU..UU.....']),
        ],
        tortuga: [
            columna([VACIO, VACIO, VACIO, '.....NNNNNN.....', '...NNLNNLNNN....', '..NNLNNLNNLNN...', 'TTNNNLNNLNNNN.T.', 'TKNNLNNLNNLNNTT.', 'TTNNNNNNNNNNN...', '..TT.......TT...', '..TTT.....TTT...']),
            columna([VACIO, VACIO, VACIO, '.....NNNNNN.....', '...NNLNNLNNN....', '..NNLNNLNNLNN...', 'TTNNNLNNLNNNN.T.', 'TKNNLNNLNNLNNTT.', 'TTNNNNNNNNNNN...', '.TT.........TT..', 'TT...........TT.']),
        ],
        bobo: [
            columna(['.....www........', '....wwwww.......', '....wkwww.......', 'MMMMMwwww.......', '..MMMwwwww......', '.....wwwMMMM....', '....wwwwMMMMM...', '....wwwwwMMMMM..', '....wwwwwMMMMMM.', '.....wwwwMMM..MM', '......wwww......', '......B..B......', '......B..B......', '.....BB.BB......']),
            columna(['.....www........', '....wwwww.......', '....wkwww.......', 'MMMMMwwww.......', '..MMMwwwww......', '.....wwwMMMM....', '....wwwwMMMMM...', '....wwwwwMMMMM..', '....wwwwwMMMMMM.', '.....wwwwMMM..MM', '......wwww......', '......B..BB.....', '......B.........', '.....BB.........']),
        ],
        ballena: [
            columna([VACIO, VACIO, VACIO, VACIO, '.............M.M', '.....ZZZZZZ...MM', '...ZZZZZZZZZZ.M.', '..ZZZZZZZZZZZZZ.', '.ZkZZZZZZZZZZZ..', 'ZZZZZZZZZZZZZZ..', 'MMMMMMMMZZZZZ...', '.MMMMMMZZ.Z.....', '...MMMM...Z.....']),
            columna(['....c.c.c.......', '.....c.c........', '......c.........', '......c.........', '.............M.M', '.....ZZZZZZ...MM', '...ZZZZZZZZZZ.M.', '..ZZZZZZZZZZZZZ.', '.ZkZZZZZZZZZZZ..', 'ZZZZZZZZZZZZZZ..', 'MMMMMMMMZZZZZ...', '.MMMMMMZZ.Z.....', '...MMMM...Z.....']),
        ],
        venado: [
            columna(['..S...S.........', '..SS.SS.........', '...SSS..........', '...VVV..........', '..VVVVV.........', '.VkVVV..........', 'VVVVVV..........', '...VVVVVVVVVVVw.', '...VVVVVVVVVVVww', '...VVVVVVVVVVVw.', '...lllllllllll..', '...V..V...V..V..', '...V..V...V..V..', '...K..K...K..K..']),
            columna(['................', '..S...S.........', '..SS.SS.........', '...SSS..........', '...VVV..........', '..VVVVV.........', '.VkVVV..........', 'VVVVVV.VVVVVVVw.', '...VVVVVVVVVVVww', '...VVVVVVVVVVVw.', '...lllllllllll..', '...V..V...V..V..', '...V..V...V..V..', '...K..K...K..K..']),
        ],
        coati: [
            columna(['..............S.', '..............K.', '..............S.', '..............K.', '.............S..', '....VVV......K..', '...VVVVVVVVVVS..', 'wwVkVVVVVVVVVV..', 'kwwVVVVVVVVVVV..', '...VVVVVVVVVVV..', '...VV..VV.VV.VV.', '...VV..VV.VV.VV.', '...KK..KK.KK.KK.']),
            columna(['.............S..', '.............K..', '.............S..', '.............K..', '.............S..', '....VVV......K..', '...VVVVVVVVVVS..', 'wwVkVVVVVVVVVV..', 'kwwVVVVVVVVVVV..', '...VVVVVVVVVVV..', '....VV.VV...VV.V', '....VV.VV..VV..V', '....KK.KK..KK..K']),
        ],
        iguana: [
            columna([VACIO, VACIO, VACIO, VACIO, VACIO, '..ddd.g.g.g.g...', '.dddddddddddd...', 'dkdddddddddddd..', 'ddddddddddddddd.', '.MMdMMMMMMdd.ddd', '...d.....d.....d', '..dd....dd......']),
            columna([VACIO, VACIO, VACIO, VACIO, VACIO, '..ddd.g.g.g.g...', '.dddddddddddd...', 'dkdddddddddddd..', 'ddddddddddddddd.', '.MMdMMMMMMdd.ddd', '.....d.....d...d', '....dd....dd....']),
        ],
        pescador: [
            columna([VACIO, '.....NNNN.......', '....NNNNNN......', '...NNkNNNN......', 'KKKKNNNNNNN.....', '...wwwwNNNNN....', '...wwwwNLNNNN...', '...rrrrNNLNNNN..', '...rrrrNNNNNNNN.', '....rrrNNNNN..NN', '.....rr.........', '.....K..K.......', 'VVVVVVVVVVVVVVVV']),
            columna([VACIO, '......NNNN......', '.....NNNNNN.....', '....NNkNNNN.....', 'KKKKKNNNNNNN....', '....wwwwNNNNN...', '....wwwwNLNNNN..', '....rrrrNNLNNNN.', '....rrrrNNNNNNNN', '.....rrrNNNNN.NN', '......rr........', '......K..K......', 'VVVVVVVVVVVVVVVV']),
        ],
        centzontle: [
            columna(['................', '................', '.....ggg........', '....ggggg.......', '..kkgkgggg......', '....ggggggg.....', '....lgggddddd...', '....llgdwwdddd..', '....llldddwwdddd', '.....lllddddd.dd', '.....lllldd...dd', '......k..k......', '.....pppppppppp.']),
        ],
        fragata: [
            columna([VACIO, '........ZZ......', '.......ZZZZ.....', '......ZZZZZ.....', '..ZZ.ZZZZZZ.....', 'MZZkZZZZZZZZZ..Z', '..rrZZZZZZZZZZZ.', '..rrrZZZZZZ..ZZ.', '...rr..........Z']),
            columna([VACIO, VACIO, VACIO, VACIO, '..ZZ...........Z', 'MZZkZZZZZZZZZ.Z.', '..rrZZZZZZZZZZZ.', '..rrrZZZZZZ..ZZ.', '...rrZZZZ......Z', '.....ZZZZ.......', '......ZZZ.......', '.......ZZ.......']),
        ],
        delfin: [
            columna([VACIO, VACIO, VACIO, '.......MM.......', '.....MMMMMM.....', '..MMMMMMMMMMM...', 'MMMkMMMMMMMMMM.M', '.wwwMMMMMMMMMMMM', '...wwwwMMMMM..MM', '......MM........', VACIO, 'B.BQ.BB.QB.BQ.BB', 'QBBBQBBQBBBQBBBQ']),
            columna([VACIO, '.......MM.......', '.....MMMMMM.....', '..MMMMMMMMMMM...', 'MMMkMMMMMMMMMM.M', '.wwwMMMMMMMMMMMM', '...wwwwMMMMM..MM', '......MM........', VACIO, VACIO, VACIO, 'BB.BQ.BB.QB.BQ.B', 'BQBBBQBBQBBBQBBB']),
        ],
        // Región: plantas
        mangle: [
            columna(['.....UNNU.......', '...UNNNNNNU.....', '..UNNLNNLNNNU...', '.UNNNNNNNNNNNU..', '..UNNNLNNNLNU...', '....UNNNNNU.....', '.......VV.......', '.......VV.......', '......VVVV......', '.....V.VV.V.....', '....V..VV..V....', '...V...VV...V...', 'BBBVBBBVVBBBVBBB', 'BQBVBQBVVBQBVBQB']),
        ],
        agave: [
            columna(['.......T........', '.......T........', '...T...T...T....', '...TT..T..TT....', '....TT.T.TT.....', 'U....TTUTT....U.', 'UU...TTUTT...UU.', '.UU..TTUTT..UU..', '..UUUTTUTTUUU...', '...UUTTUTTUU....', '....UTTUTTU.....', '.....UTUTU......', '...VVVVVVVVV....', '..VVVVVVVVVVV...']),
        ],
        pata: [
            columna(['...T..T.T..T....', '..TUT.TUT.TUT...', '.TU.TUTTTUT.UT..', 'TU..UTTTTTU..UT.', 'U..TU.TTT.UT..U.', '..TU...V...UT...', '..U....V....U...', '.......V........', '.......V........', '......VVV.......', '.....VVVVV......', '....VSVVVVV.....', '....VVVSVVV.....', '...VVVVVVVSV....', '...VVSVVVVVV....', '...KKKKKKKKK....']),
            columna(['.....T..T.T..T..', '...TUT.TUT.TUT..', '..TU.TUTTTUT.UT.', '.TU..UTTTTTU..UT', '.U..TU.TTT.UT..U', '...TU..V....UT..', '...U...V.....U..', '.......V........', '.......V........', '......VVV.......', '.....VVVVV......', '....VSVVVVV.....', '....VVVSVVV.....', '...VVVVVVVSV....', '...VVSVVVVVV....', '...KKKKKKKKK....']),
        ],
        capomo: [
            columna(['....UNNNNNU.....', '..UNNNNLNNNNU...', '.UNNLNNNNNLNNU..', 'UNNNNNyNNNNNNNU.', 'UNNyNNNNNLNNyNU.', '.UNNNNLNNNNNNU..', '..UUNNNNNNNUU...', '....UUVVVUU.....', '......VVV.......', '......VVV.......', '......VVV.......', '.....VVVVV......', '...KKKKKKKKK....']),
            columna(['...UNNNNNU......', '.UNNNNLNNNNU....', 'UNNLNNNNNLNNU...', 'UNNNNNNyNNNNNNU.', '.UNNyNNNNNLNNyNU', '..UNNNNLNNNNNNU.', '...UUNNNNNNNUU..', '....UUVVVUU.....', '......VVV.......', '......VVV.......', '......VVV.......', '.....VVVVV......', '...KKKKKKKKK....']),
        ],
        nopal: [
            columna(['.....P....P.....', '....PPP..PPP....', '....NNN..NNN....', '...NNLNNNNLNN...', '...NLNNNNNNLN...', '...NNNLNNLNNN...', '....NNNNNNNN....', '.....NNNNNN.....', '.....NLNNLN.....', '.....NNNNNN.....', '.....NNLNNN.....', '......NNNN......', '...VVVVVVVVVV...', '..VVVVVVVVVVVV..']),
        ],
        // Región: pueblo wixárika. El hikuri se dibuja como una flor sobre un botón de cactus; no es una planta de Nayarit, sino sagrada para este pueblo
        hikuri: [
            columna([VACIO, VACIO, VACIO, '.......ww.......', '......wPPw......', '....TTTwwTTT....', '...TUTTTTTTUT...', '..TTUTTTTTTUTT..', '..TTTUTTTTUTTT..', '..TTTUTTTTUTTT..', '...TTUTTTTUTT...', '....TTTTTTTT....', '...VVVVVVVVVV...', '..VVVVVVVVVVVV..']),
            columna([VACIO, VACIO, '.....w.ww.w.....', '......wPPw......', '....wwPyyPww....', '....TTwPPwTT....', '...TUTTwwTTUT...', '..TTUTTTTTTUTT..', '..TTTUTTTTUTTT..', '..TTTUTTTTUTTT..', '...TTUTTTTUTT...', '....TTTTTTTT....', '...VVVVVVVVVV...', '..VVVVVVVVVVVV..']),
        ],
        // Ojo de dios (tsikuri): rombos concéntricos de colores, se calcula para que sean exactos
        tsikuri: [0, 1, 2, 3].map((g) => {
            const COL = ['y', 'P', 'Q', 'F', 'E', 'v'];
            return Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
                const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
                if (d > 8) return (x === 7 || x === 8) ? 'V' : (y === 7 || y === 8) ? 'V' : '.';
                return COL[(Math.floor(d / 1.5) + g) % COL.length];
            }).join(''));
        }),
        // Jícara con chaquira: los puntos de color cambian como cuentas que brillan
        jicara: [0, 1, 2].map((g) => {
            const COL = ['Q', 'P', 'y', 'F', 'E'];
            return Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
                const dx = x - 7.5, dy = y - 3;
                const dentro = y >= 4 && y <= 13 && (dx * dx) / 64 + (dy * dy) / 110 <= 1;
                if (!dentro) return '.';
                if (y === 4) return 'V';
                return COL[(Math.abs(Math.round(dx)) + y + g) % COL.length];
            }).join(''));
        }),
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
                if (n === cuadros.length - 1) espera = 1500;
            }
            setTimeout(paso, espera);
        };
        setTimeout(paso, 500 + Math.random() * 1800);
    });

    // --- ANIMALES QUE PASEAN (portada): caminan por los espacios entre secciones; al hacer clic se abre su ficha y se desbloquea
    // en la colección de #nayarit. Con movimiento reducido o modo ligero no caminan y las fichas quedan abiertas desde el inicio.
    // La información está en el HTML: sin JavaScript se lee completa.
    let abrirFichaAve = null;
    const coleccion = document.querySelector('[data-fauna]');
    if (coleccion) {
        const ingles = raiz.lang === 'en';
        const fichas = [...coleccion.querySelectorAll('.ficha')];
        const juegoActivo = mueve();
        const leer = () => { try { return JSON.parse(localStorage.getItem('ollintep-fauna')) || []; } catch (e) { return []; } };
        const hallados = new Set(leer());
        const cuenta = coleccion.querySelector('[data-fauna-n]');
        const listo = coleccion.querySelector('.buscar-listo');
        const pintarColeccion = () => {
            fichas.forEach(f => {
                const abierta = !juegoActivo || hallados.has(f.dataset.especie);
                f.classList.toggle('bloqueada', !abierta);
                f.querySelector('.ficha-info').hidden = !abierta;
                f.querySelector('.ficha-oculta').hidden = abierta;
            });
            const n = juegoActivo ? hallados.size : fichas.length;
            cuenta.textContent = n;
            listo.hidden = n < fichas.length;
        };
        pintarColeccion();

        // El premio del easter egg: al encontrar todo, todos cruzan la pantalla una vez
        const desfile = () => {
            if (reducido) return;
            const capa = document.createElement('div');
            capa.className = 'desfile';
            capa.setAttribute('aria-hidden', 'true');
            document.body.append(capa);
            const ancho = raiz.clientWidth;
            fichas.forEach((f, i) => {
                const c = lienzo('');
                c.width = c.height = 16;
                capa.append(c);
                const cuadros = SPRITES[f.dataset.especie];
                const ctx = c.getContext('2d');
                pintarSprite(ctx, cuadros[0]);
                let n = 0;
                const aleteo = setInterval(() => { ctx.clearRect(0, 0, 16, 16); pintarSprite(ctx, cuadros[++n % cuadros.length]); }, 190);
                setTimeout(() => clearInterval(aleteo), 20000);
                c.animate([{ translate: `${ancho + 20}px 0` }, { translate: '-70px 0' }], { duration: 9000, delay: i * 520, easing: 'linear', fill: 'both' });
            });
            setTimeout(() => capa.remove(), 20000);
        };

        const dialogo = document.createElement('dialog');
        dialogo.className = 'ficha-dialogo';
        document.body.append(dialogo);
        dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
        dialogo.addEventListener('close', () => document.querySelector('.ave-vuelo')?.getAnimations().forEach(x => x.play()));
        const abrirFicha = (especie) => {
            const ficha = fichas.find(f => f.dataset.especie === especie);
            if (!ficha) return;
            const nuevo = juegoActivo && !hallados.has(especie);
            if (nuevo) {
                hallados.add(especie);
                try { localStorage.setItem('ollintep-fauna', JSON.stringify([...hallados])); } catch (e) { /* sin almacenamiento dura lo que dure la página */ }
                pintarColeccion();
                document.querySelectorAll(`.bicho[data-especie="${especie}"]`).forEach(b => b.classList.remove('nuevo'));
            }
            dialogo.textContent = '';
            const sello = document.createElement('p');
            sello.className = 'ficha-sello';
            const completo = nuevo && hallados.size === fichas.length;
            sello.textContent = completo ? (ingles ? 'You found them all!' : '¡Los encontraste a todos!') : nuevo ? (ingles ? `Found: ${hallados.size} of ${fichas.length}` : `Encontrado: ${hallados.size} de ${fichas.length}`) : (ingles ? 'In your collection' : 'En tu colección');
            if (completo) dialogo.addEventListener('close', desfile, { once: true });
            const lienzoGrande = document.createElement('canvas');
            lienzoGrande.className = 'pixel ficha-sprite';
            lienzoGrande.width = lienzoGrande.height = 16;
            lienzoGrande.setAttribute('aria-hidden', 'true');
            pintarSprite(lienzoGrande.getContext('2d'), SPRITES[especie][0]);
            const info = ficha.querySelector('.ficha-info').cloneNode(true);
            info.hidden = false;
            const cerrar = document.createElement('button');
            cerrar.type = 'button';
            cerrar.className = 'm3-btn m3-btn-tonal ficha-cerrar';
            cerrar.textContent = ingles ? 'Close' : 'Cerrar';
            cerrar.addEventListener('click', () => dialogo.close());
            dialogo.append(sello, lienzoGrande, info, cerrar);
            dialogo.showModal();
        };
        abrirFichaAve = () => abrirFicha('centzontle');
        coleccion.classList.add('con-dialogo');
        fichas.forEach(f => {
            f.tabIndex = 0;
            f.addEventListener('click', () => { if (!f.classList.contains('bloqueada')) abrirFicha(f.dataset.especie); });
            f.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !f.classList.contains('bloqueada')) { e.preventDefault(); abrirFicha(f.dataset.especie); } });
        });

        if (juegoActivo) {
            // Los animales caminan; las plantas y el arte se quedan plantados en su sitio
            const PLANTADOS = new Set(['mangle', 'agave', 'nopal', 'pata', 'capomo', 'hikuri', 'tsikuri', 'jicara']);
            const PASEANTES = [
                ['jaguar', '#suite'], ['agave', '#suite'], ['tortuga', '#suite'],
                ['iguana', '#a-medida'], ['nopal', '#a-medida'], ['pescador', '#a-medida'],
                ['coati', '#servicio-tecnico'], ['tsikuri', '#servicio-tecnico'], ['cocodrilo', '#servicio-tecnico'],
                ['venado', '#principios'], ['hikuri', '#principios'], ['bobo', '#principios'],
                ['ballena', '#contacto'], ['mangle', '#contacto'], ['jicara', '#contacto'],
                ['iguana', '#nayarit'], ['pata', '#nayarit'], ['capomo', '#nayarit'],
                ['fragata', '#suite'], ['delfin', '#contacto'],
            ];
            const franjas = new Map();
            PASEANTES.forEach(([especie, ancla]) => {
                const seccion = document.querySelector(ancla);
                const ficha = fichas.find(f => f.dataset.especie === especie);
                if (!seccion || !ficha) return;
                let franja = franjas.get(ancla);
                if (!franja) {
                    franja = document.createElement('div');
                    franja.className = 'paseo';
                    seccion.before(franja);
                    franjas.set(ancla, franja);
                }
                const plantado = PLANTADOS.has(especie);
                const nombre = ficha.querySelector('.ficha-nombre').textContent.trim();
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'bicho';
                b.dataset.especie = especie;
                b.classList.toggle('nuevo', !hallados.has(especie));
                b.classList.toggle('plantado', plantado);
                b.setAttribute('aria-label', ingles ? `${nombre}: open its card` : `${nombre}: abrir su ficha`);
                const c = lienzo('pixel');
                c.width = c.height = 16;
                b.append(c);
                franja.append(b);
                const ctx = c.getContext('2d');
                const cuadros = SPRITES[especie];
                const pinta = (n) => { ctx.clearRect(0, 0, 16, 16); pintarSprite(ctx, cuadros[n % cuadros.length]); };
                pinta(0);
                // Los plantados se quedan en una orilla; los que caminan salen de un costado, cruzan, se van y vuelven mucho después
                const ANCHO_BICHO = 44;
                const orilla = () => {
                    const margen = Math.random() * Math.max(8, franja.clientWidth * .07);
                    return Math.random() > .5 ? margen : franja.clientWidth - ANCHO_BICHO - margen;
                };
                let x = plantado ? orilla() : -60, dir = 1, anim = null, visible = false, retenido = false, n = 0, andando = false, espera = 0;
                b.style.translate = `${x}px 0`;
                const programar = (ms) => { clearTimeout(espera); espera = setTimeout(() => { espera = 0; caminar(); }, ms); };
                const caminar = () => {
                    if (plantado) return;
                    if (!visible || retenido || dialogo.open || !mueve()) { andando = false; return; }
                    const fin = franja.clientWidth + 16;
                    const fuera = x < -40 || x > fin - 20;
                    if (fuera) {
                        // Entra por un costado al azar
                        dir = Math.random() > .5 ? 1 : -1;
                        x = dir > 0 ? -60 : fin;
                    }
                    const tramo = 140 + Math.random() * 320;
                    const destino = dir > 0 ? Math.min(x + tramo, fin) : Math.max(x - tramo, -60);
                    c.style.scale = dir > 0 ? '-1 1' : '1 1';
                    andando = true;
                    anim = b.animate([{ translate: `${x}px 0` }, { translate: `${destino}px 0` }], { duration: Math.abs(destino - x) / .03, easing: 'linear', fill: 'forwards' });
                    anim.onfinish = () => {
                        x = destino;
                        b.style.translate = `${x}px 0`;
                        anim.cancel();
                        anim = null;
                        andando = false;
                        pinta(0);
                        const salio = x <= -60 || x >= fin;
                        if (salio) return programar(18000 + Math.random() * 42000);   // tarda en volver
                        if (Math.random() < .2) dir = -dir;
                        programar(500 + Math.random() * 2500);
                    };
                };
                setInterval(() => { if ((andando || plantado) && visible && !retenido) pinta(++n); }, plantado ? 1100 : 190);
                const detener = () => {
                    retenido = true;
                    if (anim) { anim.pause(); }
                };
                const seguir = () => {
                    retenido = false;
                    if (anim && visible) anim.play();
                    else if (!anim && !espera) programar(600);
                };
                b.addEventListener('pointerenter', detener);
                b.addEventListener('pointerleave', seguir);
                b.addEventListener('focus', () => {
                    detener();
                    // Con teclado también se puede encontrar: si está fuera de la pantalla, se asoma
                    if (!plantado && !anim && (x < 0 || x > franja.clientWidth - ANCHO_BICHO)) { x = 12; b.style.translate = `${x}px 0`; }
                });
                b.addEventListener('blur', seguir);
                b.addEventListener('click', () => abrirFicha(especie));
                new IntersectionObserver(([e]) => {
                    visible = e.isIntersecting;
                    if (!visible) { if (anim) anim.pause(); return; }
                    if (anim) anim.play();
                    else if (!plantado && !espera) programar(2000 + Math.random() * 20000);   // cada uno a su ritmo
                }, { rootMargin: '0px', threshold: 0 }).observe(franja.querySelector('span') || franja.appendChild(document.createElement('span')));
            });
        }
    }

    // --- CHAQUIRA: banda de cuentas de colores, inspirada en los diseños geométricos wixárika. Es una imagen fija.
    document.querySelectorAll('[data-chaquira]').forEach(banda => {
        const COL = ['#22d3ee', '#ec4899', '#fde047', '#f97316', '#b05cff', '#34d399'];
        const c = document.createElement('canvas');
        c.width = 36; c.height = 13;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#10182a';
        ctx.fillRect(0, 0, 36, 13);
        for (let y = 0; y < 13; y++) for (let x = 0; x < 36; x++) {
            const f = x % 12, d = Math.abs(f - 5.5) + Math.abs(y - 6);
            if (y === 0 || y === 12) { ctx.fillStyle = COL[Math.floor(x / 3) % COL.length]; ctx.fillRect(x, y, 1, 1); continue; }
            if (d > 7) continue;
            ctx.fillStyle = COL[(Math.floor(x / 12) * 2 + Math.floor(d / 2)) % COL.length];
            ctx.fillRect(x, y, 1, 1);
        }
        banda.style.backgroundImage = `url(${c.toDataURL()})`;
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
        marco.append(banda);
        pie.before(marco);
        if (!reducido) {
            // El centzontle que cruza también es parte del easter egg: se le puede dar clic y se detiene al pasarle el cursor
            const ave = document.createElement('button');
            ave.type = 'button';
            ave.className = 'ave-vuelo';
            const inglesAve = raiz.lang === 'en';
            ave.setAttribute('aria-label', inglesAve ? 'Mockingbird: open its card' : 'Centzontle: abrir su ficha');
            const lienzoAve = lienzo('');
            lienzoAve.width = 16; lienzoAve.height = 12;
            ave.append(lienzoAve);
            marco.append(ave);
            const av = lienzoAve.getContext('2d');
            const ALAS = [
                ['................', '.......dd.......', '.......ddd......', '..kgggdddddd.ddd', 'kkkgkggggggddddd', '...lllllldd...dd', '....lllll.......'],
                ['................', '................', '................', '..kggggggggd.ddd', 'kkkgkggggggddddd', '...lllddddd...dd', '.....ddd........', '.....dd.........'],
            ];
            let visible = false, vuelo = null;
            new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(marco);
            let aleteo = 0;
            setInterval(() => { if (visible) { aleteo = 1 - aleteo; av.clearRect(0, 0, 16, 12); pintarSprite(av, ALAS[aleteo], 0, 2); } }, 170);
            const volar = () => {
                if (!visible || vuelo || ligero() || document.hidden) return;
                vuelo = ave.animate([{ translate: `${raiz.clientWidth}px 0` }, { translate: '-90px -18px' }], { duration: 11000, easing: 'linear' });
                vuelo.onfinish = vuelo.oncancel = () => { vuelo = null; };
            };
            ave.addEventListener('pointerenter', () => vuelo?.pause());
            ave.addEventListener('pointerleave', () => { if (vuelo && !document.querySelector('dialog[open]')) vuelo.play(); });
            ave.addEventListener('focus', () => vuelo?.pause());
            ave.addEventListener('blur', () => vuelo?.play());
            ave.addEventListener('click', () => {
                if (abrirFichaAve) return abrirFichaAve();
                // En las otras páginas no está la colección: se anota el hallazgo y se abre aquí mismo
                try {
                    const h = new Set(JSON.parse(localStorage.getItem('ollintep-fauna')) || []);
                    h.add('centzontle');
                    localStorage.setItem('ollintep-fauna', JSON.stringify([...h]));
                } catch (e) { /* sin almacenamiento no se recuerda, y no pasa nada */ }
                const d = document.createElement('dialog');
                d.className = 'ficha-dialogo';
                const lienzoGrande = lienzo('pixel ficha-sprite');
                lienzoGrande.width = lienzoGrande.height = 16;
                pintarSprite(lienzoGrande.getContext('2d'), SPRITES.centzontle[0]);
                const crear = (etiqueta, clase, texto) => { const n = document.createElement(etiqueta); n.className = clase; n.textContent = texto; return n; };
                const cerrar = crear('button', 'm3-btn m3-btn-tonal ficha-cerrar', inglesAve ? 'Close' : 'Cerrar');
                cerrar.type = 'button';
                cerrar.addEventListener('click', () => d.close());
                d.append(crear('p', 'ficha-sello', inglesAve ? 'Added to your collection' : 'Añadido a tu colección'), lienzoGrande,
                    crear('h3', 'ficha-nombre', inglesAve ? 'Mockingbird (centzontle)' : 'Centzontle'),
                    crear('p', 'ficha-texto', inglesAve ? 'Its name comes from Nahuatl and means “four hundred voices”, because it imitates the songs of other birds. It gives our Centzontle point of sale its name.' : 'Su nombre viene del náhuatl y significa «cuatrocientas voces», porque imita el canto de otras aves. Da nombre a nuestro punto de venta Centzontle.'), cerrar);
                d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
                d.addEventListener('close', () => { d.remove(); vuelo?.play(); });
                document.body.append(d);
                d.showModal();
            });
            setInterval(volar, 15000);
            setTimeout(volar, 2500);
        }
    }

    // --- AGUA EN LA SELECCIÓN DEL MENÚ: dentro del recuadro que marca el enlace bajo el cursor sube agua, que se agita al moverse.
    // Solo con ratón y en escritorio; se detiene por completo cuando el recuadro queda en calma.
    const montarAgua = () => {
        const pildora = document.querySelector('.nav-pill');
        const menu = document.querySelector('.nav-links');
        if (!pildora || !menu || !escritorio || !matchMedia('(hover: hover) and (pointer: fine)').matches || !mueve()) return;
        const c = lienzo('nav-agua');
        pildora.append(c);
        const ctx = c.getContext('2d');
        const W = c.width = 160, H = c.height = 48, N = 40;
        const alto = new Float32Array(N + 1), vel = new Float32Array(N + 1);
        // Cada producto define su color más abajo que la raíz: se lee desde el propio recuadro
        const color = getComputedStyle(pildora).getPropertyValue('--md-sys-color-primary').trim() || '#6ea2ff';
        const burbujas = Array.from({ length: 4 }, (_, i) => ({ x: .15 + i * .22, y: Math.random(), v: .25 + Math.random() * .3 }));
        let nivel = 0, objetivo = 0, marco = 0, t = 0, ultimoX = null, ultimaPos = null, estiron = 0;
        const dibujar = () => {
            t += .016;
            nivel += (objetivo - nivel) * .09;
            // Al saltar de un enlace a otro el recuadro se mueve y el agua se balancea
            const pos = parseFloat(getComputedStyle(pildora).translate) || 0;   // la posición real, sin contar el estirón
            // La forma también es líquida: se estira en la dirección del salto y recupera la gota al frenar
            const rapidez = ultimaPos === null ? 0 : Math.abs(pos - ultimaPos);
            estiron += (Math.min(rapidez, 40) - estiron) * .22;
            pildora.style.scale = estiron > .2 ? `${(1 + estiron * .009).toFixed(3)} ${(1 - estiron * .007).toFixed(3)}` : '';
            if (ultimaPos !== null && Math.abs(pos - ultimaPos) > .5) {
                const empuje = Math.max(-3, Math.min(3, (pos - ultimaPos) * .06));
                for (let i = 0; i <= N; i++) vel[i] += empuje * (i / N - .5) * .3;
            }
            ultimaPos = pos;
            for (let i = 1; i < N; i++) vel[i] += (alto[i - 1] + alto[i + 1] - 2 * alto[i]) * .2 - alto[i] * .06;
            let movimiento = 0;
            for (let i = 0; i <= N; i++) { vel[i] *= .94; alto[i] = Math.max(-H * .22, Math.min(H * .22, alto[i] + vel[i])); movimiento += Math.abs(vel[i]); }
            ctx.clearRect(0, 0, W, H);
            if (nivel > .004) {
                const base = H * (1 - nivel) + 1;   // al llenarse llega hasta arriba y la gota queda completa
                const superficie = (i) => base + alto[i] + Math.sin(i * .5 + t * 4) * 1.5 * nivel + Math.sin(i * .2 - t * 2.3) * 1.8 * nivel;
                ctx.beginPath();
                ctx.moveTo(0, H);
                for (let i = 0; i <= N; i++) ctx.lineTo(i * W / N, superficie(i));
                ctx.lineTo(W, H);
                ctx.closePath();
                // Del color de cada página, más oscuro hacia el fondo
                ctx.globalAlpha = .72 * Math.min(1, nivel * 1.6);
                ctx.fillStyle = color;
                ctx.fill();
                const sombra = ctx.createLinearGradient(0, 0, 0, H);
                sombra.addColorStop(0, 'rgba(10, 18, 36, 0)');
                sombra.addColorStop(1, 'rgba(10, 18, 36, .45)');
                ctx.fillStyle = sombra;
                ctx.fill();
                ctx.beginPath();
                for (let i = 0; i <= N; i++) i ? ctx.lineTo(i * W / N, superficie(i)) : ctx.moveTo(0, superficie(0));
                ctx.globalAlpha = .9 * nivel;
                ctx.strokeStyle = '#dbe7ff';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                [.45, .75].forEach((f, k) => {
                    ctx.beginPath();
                    for (let i = 0; i <= N; i++) {
                        const y = base + (H - base) * f + alto[i] * .6 + Math.sin(i * .32 + t * (2.4 - k) + k * 2) * 2.2;
                        i ? ctx.lineTo(i * W / N, y) : ctx.moveTo(0, y);
                    }
                    ctx.globalAlpha = .16 * nivel;
                    ctx.stroke();
                });
                ctx.fillStyle = '#dbe7ff';
                burbujas.forEach(b => {
                    b.y -= b.v * .016;
                    if (b.y < 0) { b.y = 1; b.x = .1 + Math.random() * .8; }
                    ctx.globalAlpha = .55 * nivel * b.y;
                    ctx.beginPath();
                    ctx.ellipse(b.x * W, base + (H - base) * b.y, 1.6, 1.3, 0, 0, 6.283);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
            }
            const calma = objetivo === 0 && nivel < .004 && movimiento < .02;
            if (calma) { nivel = 0; ultimaPos = null; estiron = 0; pildora.style.scale = ''; pildora.classList.remove('liquida'); ctx.clearRect(0, 0, W, H); }
            marco = calma ? 0 : requestAnimationFrame(dibujar);
        };
        menu.querySelectorAll('a:not(.m3-btn):not(.product-back-btn)').forEach(a => {
            a.addEventListener('pointerenter', () => {
                if (ligero()) return;
                objetivo = 1;
                pildora.classList.add('liquida');
                if (!marco) marco = requestAnimationFrame(dibujar);
            });
            a.addEventListener('pointermove', (e) => {
                const r = a.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const fuerza = ultimoX === null ? 0 : Math.min(Math.abs(x - ultimoX) * 60, 7);
                const i = Math.max(2, Math.min(N - 2, Math.round(x * N)));
                for (let k = -2; k <= 2; k++) vel[i + k] -= fuerza * .22 * (1 - Math.abs(k) / 3);
                ultimoX = x;
            }, { passive: true });
            a.addEventListener('pointerleave', () => { objetivo = 0; ultimoX = null; });
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarAgua, { once: true });
    else montarAgua();

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
