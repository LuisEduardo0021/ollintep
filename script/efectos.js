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

    // --- METABALLS (Suite): nueve gotas de gel, una por app con su icono, se funden en una al hacer scroll y aparece CroHub.
    // «Nueve apps. Un solo lanzador.» Resolución completa de la pantalla y borde antialias de un píxel calculado con el gradiente.
    document.querySelectorAll('[data-metaballs]').forEach(caja => {
        if (!escritorio || !mueve()) return caja.remove();
        const c = lienzo('metaballs-lienzo');
        const gl = c.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
        if (!gl) return caja.remove();
        const APPS = [['crovite-pdf', '#ff8a3d'], ['croma-studio', '#ffcf3a'], ['cronmy', '#c2ec3e'], ['crovect-studio', '#c04df6'], ['cromofi', '#2fd6c4'],
            ['croudio', '#ff5562'], ['crobeat', '#8a86ff'], ['cromix', '#22d3ee'], ['croguard', '#4fc4ff']];
        const rgb = [...APPS.flatMap(([, h]) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)), .9, .93, 1];   // la décima es el cursor
        const compilar = (tipo, src) => { const sh = gl.createShader(tipo); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
        const prog = gl.createProgram();
        gl.attachShader(prog, compilar(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
        gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, `precision highp float;
            uniform vec3 b[10];uniform vec3 k[10];uniform float m;uniform float s;
            void main(){
              vec2 u=gl_FragCoord.xy;float f=0.;vec3 col=vec3(0.);float w=0.;vec2 g=vec2(0.);
              for(int i=0;i<10;i++){
                vec2 d=u-b[i].xy;float r2=b[i].z*b[i].z;float dd=dot(d,d)+r2*.04+1.;float v=r2/dd;
                f+=v;g+=-2.*r2*d/(dd*dd);float q=v*v;col+=k[i]*q;w+=q;
              }
              col/=max(w,1e-5);col=mix(col,vec3(1.,.478,.18),m);
              float gm=max(length(g),1e-4);
              float a=clamp((f-1.)/gm+.5,0.,1.);
              if(a<=0.){gl_FragColor=vec4(0.);return;}
              // Normal de la superficie a partir del gradiente: luz difusa, brillo especular y borde iluminado (gel)
              vec3 n=normalize(vec3(-g/(f*f)*s*.8,1.));
              vec3 L=normalize(vec3(-.45,.65,.62));
              float dif=.78+.3*max(dot(n,L),0.);
              float esp=pow(max(dot(reflect(-L,n),vec3(0.,0.,1.)),0.),48.);
              float borde=pow(max(1.-n.z,0.),2.2);
              vec3 c=col*dif+vec3(1.)*esp*.85+col*borde*.55+vec3(.9,.95,1.)*borde*.18;
              c*=1.-smoothstep(1.6,6.,f)*.12;
              gl_FragColor=vec4(c*a,a);
            }`));
        gl.bindAttribLocation(prog, 0, 'p');
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('metaballs:', gl.getProgramInfoLog(prog)); return caja.remove(); }
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.uniform3fv(gl.getUniformLocation(prog, 'k'), new Float32Array(rgb));
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const uB = gl.getUniformLocation(prog, 'b'), uM = gl.getUniformLocation(prog, 'm'), uS = gl.getUniformLocation(prog, 's');
        caja.append(c);
        // Iconos de las apps sobre sus gotas y CroHub en el centro cuando se funden: SVG, nítidos a cualquier escala
        const capa = document.createElement('div');
        capa.className = 'metaballs-iconos';
        const iconos = APPS.map(([id]) => { const im = new Image(); im.src = new URL(`../resources/suite/${id}-icono.svg`, base).href; im.alt = ''; im.decoding = 'async'; capa.append(im); return im; });
        const hub = new Image(); hub.src = new URL('../resources/suite/crohub.svg', base).href; hub.alt = ''; hub.className = 'mb-hub'; capa.append(hub);
        caja.append(capa);
        // Resolución completa (hasta 2× en pantallas densas): el usuario pidió que todo se vea súper definido
        let esc = 1;
        const medir = () => { esc = Math.min(devicePixelRatio || 1, 2); c.width = Math.round(caja.clientWidth * esc); c.height = Math.round(caja.clientHeight * esc); gl.viewport(0, 0, c.width, c.height); };
        medir();
        addEventListener('resize', medir);
        const pos = new Float32Array(30);
        let cursorX = -1, cursorY = -1, cx = 0, cy = 0, fuerza = 0;
        const zona = caja.closest('section') || caja;
        zona.addEventListener('pointermove', (ev) => {
            const r = caja.getBoundingClientRect();
            if (cursorX < 0) { cx = (ev.clientX - r.left) * esc; cy = (r.bottom - ev.clientY) * esc; }
            cursorX = (ev.clientX - r.left) * esc;
            cursorY = (r.bottom - ev.clientY) * esc;   // WebGL cuenta desde abajo
        }, { passive: true });
        zona.addEventListener('pointerleave', () => { cursorX = cursorY = -1; });
        bucle(caja, 60, (t) => {
            const r = caja.getBoundingClientRect();
            const p = limitar((innerHeight * .92 - r.top) / (innerHeight * .55));
            const e = p * p * (3 - 2 * p);
            const w = c.width, h = c.height;
            cx += (cursorX - cx) * .12;
            cy += (cursorY - cy) * .12;
            // La gota del cursor solo existe cuando está dentro de la franja
            const dentro = cursorX >= 0 && cursorY > -h * .2 && cursorY < h * 1.2;
            fuerza += ((dentro ? 1 : 0) - fuerza) * .08;
            const R = h * .125;
            for (let i = 0; i < 9; i++) {
                // Separadas: cada gota vaga por su cuenta y a ratos toca a sus vecinas
                const ox = w * (.08 + i * .105) + Math.sin(t * .8 + i * 2.1) * w * .045 + Math.cos(t * .37 + i) * w * .02;
                const oy = h / 2 + Math.sin(t * 1.25 + i * 1.7) * h * .2;
                // Fundidas: siguen orbitando dentro de la masa, que se deforma y a veces suelta una gota
                const ang = t * (.55 + i * .06) * (i % 2 ? 1 : -1) + i * .7;
                const salida = Math.pow(Math.max(0, Math.sin(t * .45 + i * 1.1)), 8);
                const radio = h * (.13 + Math.sin(t * .8 + i) * .05 + salida * .1);
                const mx = w / 2 + Math.cos(ang) * radio * 2.1, my = h / 2 + Math.sin(ang) * radio * .85;
                const bx = ox + (mx - ox) * e, by = oy + (my - oy) * e;
                // El cursor las atrae un poco, con inercia
                const ax = (cx - bx) * .14 * fuerza, ay = (cy - by) * .14 * fuerza;
                pos[i * 3] = bx + ax;
                pos[i * 3 + 1] = limitar(by + ay, h * .3, h * .7);
                pos[i * 3 + 2] = R * (1 - e * .3) + Math.sin(t * 1.6 + i * 2) * h * .014;
            }
            pos[27] = cx; pos[28] = limitar(cy, h * .2, h * .8); pos[29] = R * .62 * fuerza;
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform3fv(uB, pos);
            gl.uniform1f(uM, limitar((e - .72) / .28) * .62);
            gl.uniform1f(uS, R);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            // Iconos: siguen a su gota en píxeles CSS; se apagan al fundirse y CroHub aparece en el centro
            const visible = limitar(1 - e * 1.8), lado = R / esc * .78;
            iconos.forEach((im, i) => {
                im.style.width = im.style.height = lado + 'px';
                im.style.transform = `translate(${pos[i * 3] / esc - lado / 2}px, ${(h - pos[i * 3 + 1]) / esc - lado / 2}px) scale(${.6 + visible * .4})`;
                im.style.opacity = visible;
            });
            const fin = limitar((e - .8) / .2), lh = R / esc * 1.05;
            hub.style.width = lh + 'px';
            hub.style.transform = `translate(${w / 2 / esc - lh / 2}px, ${h / 2 / esc - lh * 259 / 237 / 2}px) scale(${.7 + fin * .3})`;
            hub.style.opacity = fin;
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
    // --- PROCESO DE UN LOGO (Diseño): boceto en papel → ASCII → vector → digital (web, app, redes) → impresión y mockups.
    // Usa el logo real de Ollin-Tep. Al pasar el cursor por un servicio, la escena salta a la etapa que le toca.
    document.querySelectorAll('[data-proceso]').forEach(caja => {
        const c = lienzo('proceso-lienzo');
        caja.prepend(c);
        const ctx = c.getContext('2d');
        const pasos = [...caja.querySelectorAll('.proceso-pasos li')];
        const ING = document.documentElement.lang === 'en';
        const FORMAS = [
            { d: 'M0 222.289V95.5572L126.054 0H180.949V225L128.087 222.289H0Z', color: '#16284F', claro: '#3d5fae' },
            { d: 'M179.593 0C210.659 0 235.843 25.184 235.843 56.25C235.843 87.0898 211.025 112.132 180.271 112.495V170.105H123.343V56.25C123.343 25.184 148.527 0 179.593 0Z', color: '#1A56DB', claro: '#1A56DB' },
            { d: 'M123.343 168.75A56.25 56.25 0 1 0 235.843 168.75A56.25 56.25 0 1 0 123.343 168.75Z', color: '#0B63F6', claro: '#0B63F6' },
            { d: 'M0 182.053C4.50337 204.596 24.2991 221.619 48.1133 221.848L48.1172 221.852H0V182.053Z', color: '#1A56DB', claro: '#1A56DB' },
        ];
        // Anclas y manijas a partir del trazado (M, L, H, V, C, A)
        FORMAS.forEach(f => {
            f.ruta = new Path2D(f.d);
            f.anclas = []; f.manijas = [];
            const tok = f.d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g);
            let i = 0, x = 0, y = 0, cmd = '';
            const n = () => +tok[i++];
            while (i < tok.length) {
                if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
                if (cmd === 'Z') continue;
                if (cmd === 'M' || cmd === 'L') { x = n(); y = n(); }
                else if (cmd === 'H') x = n();
                else if (cmd === 'V') y = n();
                else if (cmd === 'C') { const a = [n(), n()], b = [n(), n()]; f.manijas.push([x, y, ...a]); x = n(); y = n(); f.manijas.push([x, y, ...b]); }
                else if (cmd === 'A') { i += 5; x = n(); y = n(); }
                f.anclas.push([x, y]);
            }
        });
        // Muestras del contorno para el boceto a lápiz
        const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
        svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
        document.body.append(svg);
        FORMAS.forEach(f => {
            const p = document.createElementNS(ns, 'path');
            p.setAttribute('d', f.d); svg.append(p);
            const L = p.getTotalLength();
            f.pts = Array.from({ length: 141 }, (_, k) => { const q = p.getPointAtLength(L * k / 140); return [q.x, q.y]; });
        });
        svg.remove();
        const rasters = new Map();
        const raster = (an, al) => {
            const clave = an + 'x' + al;
            if (!rasters.has(clave)) {
                const o = document.createElement('canvas'); o.width = an; o.height = al;
                const oc = o.getContext('2d', { willReadFrequently: true });
                oc.scale(an / 236, al / 225);
                FORMAS.forEach(f => { oc.fillStyle = f.color; oc.fill(f.ruta); });
                rasters.set(clave, oc.getImageData(0, 0, an, al).data);
            }
            return rasters.get(clave);
        };
        const DUR = [4.4, 3.8, 4.4, 4.4, 5.2], INICIO = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
        const TOTAL = DUR.reduce((a, b) => a + b, 0);
        const FOCO = { logotipos: 2, identidad: 4, publicidad: 4, interfaces: 3 };
        const sale = (x) => 1 - Math.pow(1 - limitar(x), 3);
        const entre = (x, a, b) => limitar((x - a) / (b - a));
        let W = 0, H = 0, dpr = 1, reloj = 0, antes = null, etapaVista = -1;

        const medir = () => {
            dpr = Math.min(devicePixelRatio || 1, 2);
            const w = caja.clientWidth, h = caja.clientHeight;
            if (w !== W || h !== H) { W = w; H = h; c.width = w * dpr; c.height = h * dpr; }
        };
        const logo = (x, y, esc, alfa = 1, claro = false) => {
            ctx.save(); ctx.globalAlpha *= alfa; ctx.translate(x, y); ctx.scale(esc, esc);
            FORMAS.forEach(f => { ctx.fillStyle = claro ? f.claro : f.color; ctx.fill(f.ruta); });
            ctx.restore();
        };
        const redondo = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
        const ventana = (a) => {
            const vw = W * .9, vh = H * .86, vx = (W - vw) / 2, vy = H * .03;
            ctx.save(); ctx.globalAlpha = a;
            redondo(vx, vy, vw, vh, 12); ctx.fillStyle = '#0d1424'; ctx.fill();
            ctx.strokeStyle = 'rgba(148,163,184,.25)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(vx, vy + 22, vw, 1);
            ['#ff5f57', '#febc2e', '#28c840'].forEach((col, k) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(vx + 14 + k * 12, vy + 11, 3.5, 0, 7); ctx.fill(); });
            ctx.fillStyle = 'rgba(203,213,225,.55)'; ctx.font = '600 9px Figtree, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('logo.crovect', vx + vw / 2, vy + 14);
            for (let k = 0; k < 5; k++) { redondo(vx + 8, vy + 34 + k * 20, 12, 12, 3); ctx.fillStyle = k === 1 ? '#6ea2ff' : 'rgba(148,163,184,.22)'; ctx.fill(); }
            ctx.strokeStyle = 'rgba(148,163,184,.25)';
            for (let x = vx + 32; x < vx + vw - 6; x += 10) { ctx.beginPath(); ctx.moveTo(x, vy + 23); ctx.lineTo(x, vy + 23 + ((x - vx) % 50 < 10 ? 6 : 3)); ctx.stroke(); }
            ctx.restore();
            return { vx, vy, vw, vh };
        };

        const dibujar = (tAbs) => {
            medir();
            if (!W || !H) return;
            const dt = antes === null ? 0 : Math.min(tAbs - antes, .1);
            antes = tAbs;
            const foco = FOCO[caja.dataset.foco];
            if (foco !== undefined) reloj = INICIO[foco] + DUR[foco] * .88;
            else reloj = (reloj + dt) % TOTAL;
            let e = 0; while (e < 4 && reloj >= INICIO[e + 1]) e++;
            const p = (reloj - INICIO[e]) / DUR[e];
            if (e !== etapaVista) { etapaVista = e; pasos.forEach((li, k) => li.classList.toggle('activo', k === e)); }
            // aparición de la etapa y salida hacia la siguiente
            const ent = sale(entre(p, 0, .12)), sal = 1 - entre(p, .9, 1);
            const t = tAbs;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            const L = Math.min(H * .56, W * .46), s = L / 236;
            const ox = W / 2 - L / 2, oy = H * .45 - 225 * s / 2;
            const X = (u) => ox + u * s, Y = (w) => oy + w * s;

            if (e === 0) {
                // 1. BOCETO: hoja, guías y lápiz con trazos dobles temblorosos
                ctx.save(); ctx.globalAlpha = Math.min(ent, sal);
                ctx.translate(W / 2, H * .45); ctx.rotate(-.035);
                const pw = Math.min(W * .7, H * 1.05), ph = pw * .78;
                ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
                ctx.fillStyle = '#f3eee3'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = 'rgba(110,140,200,.18)'; ctx.lineWidth = 1;
                for (let y = -ph / 2 + 16; y < ph / 2; y += 13) { ctx.beginPath(); ctx.moveTo(-pw / 2 + 6, y); ctx.lineTo(pw / 2 - 6, y); ctx.stroke(); }
                ctx.strokeStyle = 'rgba(220,90,90,.35)'; ctx.beginPath(); ctx.moveTo(-pw / 2 + 22, -ph / 2); ctx.lineTo(-pw / 2 + 22, ph / 2); ctx.stroke();
                ctx.restore();
                ctx.save(); ctx.globalAlpha = Math.min(ent, sal);
                // guías de construcción
                const g = sale(entre(p, .05, .2));
                ctx.strokeStyle = 'rgba(70,90,140,.35)'; ctx.lineWidth = .8; ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.arc(X(179.6), Y(168.75), 56.25 * s * g, 0, 7); ctx.stroke();
                ctx.beginPath(); ctx.arc(X(179.6), Y(56.25), 56.25 * s * g, 0, 7); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(X(-10), Y(112)); ctx.lineTo(X(-10 + 260 * g), Y(112)); ctx.stroke();
                ctx.setLineDash([]);
                // trazos a lápiz
                const total = entre(p, .12, .82) * FORMAS.length;
                let punta = null;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                FORMAS.forEach((f, i) => {
                    const hecho = limitar(total - i);
                    if (!hecho) return;
                    const k = Math.floor(hecho * (f.pts.length - 1));
                    for (let pase = 0; pase < 2; pase++) {
                        ctx.strokeStyle = pase ? 'rgba(40,40,52,.55)' : 'rgba(40,40,52,.85)';
                        ctx.lineWidth = pase ? .8 : 1.25;
                        ctx.beginPath();
                        for (let j = 0; j <= k; j++) {
                            const [u, w] = f.pts[j];
                            const jx = (azarDe(i * 997 + j * 13 + pase * 71) - .5) * (pase ? 3.2 : 1.6), jy = (azarDe(i * 991 + j * 17 + pase * 53) - .5) * (pase ? 3.2 : 1.6);
                            const px = X(u + jx), py = Y(w + jy);
                            j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
                            if (j === k) punta = [px, py];
                        }
                        ctx.stroke();
                    }
                });
                // sombreado a rayas en la pieza oscura
                const r = entre(p, .8, .9);
                if (r) {
                    ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s); ctx.clip(FORMAS[0].ruta);
                    ctx.strokeStyle = 'rgba(40,40,52,.4)'; ctx.lineWidth = .9 / s;
                    for (let d = -240; d < 240 * (r * 2 - 1); d += 9) { ctx.beginPath(); ctx.moveTo(d, 230); ctx.lineTo(d + 230, 0); ctx.stroke(); }
                    ctx.restore();
                    punta = punta && r < 1 ? [X(60 + r * 80), Y(170 - r * 80)] : punta;
                }
                // lápiz
                if (punta && p < .9) {
                    ctx.save(); ctx.translate(punta[0], punta[1]); ctx.rotate(-.75);
                    ctx.fillStyle = '#f2c94c'; ctx.fillRect(4, -3.5, 46, 7);
                    ctx.fillStyle = '#e9d8b4'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -3.5); ctx.lineTo(8, 3.5); ctx.fill();
                    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(2.6, -1.2); ctx.lineTo(2.6, 1.2); ctx.fill();
                    ctx.fillStyle = '#e88aa0'; ctx.fillRect(50, -3.5, 7, 7);
                    ctx.restore();
                }
                ctx.restore();
            }

            if (e === 1) {
                // 2. ASCII: cada píxel se vuelve un carácter; primero al azar y luego en su sitio
                const v = ventana(Math.min(ent, sal));
                ctx.save(); ctx.globalAlpha = Math.min(ent, sal);
                const cols = 30, cw = L / cols, ch = cw * 1.55, rows = Math.round(225 * s / ch), datos = raster(cols, rows);
                ctx.font = `600 ${ch * .95}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const fija = entre(p, .05, .6);
                for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
                    const q = (j * cols + i) * 4, a = datos[q + 3] / 255;
                    if (a < .12) continue;
                    let r = datos[q], g = datos[q + 1], b = datos[q + 2];
                    const luz = .55 + .45 * (1 - j / rows) * (1 - i / cols * .4);
                    r = Math.min(255, r * 1.6 + 60 * luz); g = Math.min(255, g * 1.4 + 70 * luz); b = Math.min(255, b + 40);
                    const listo = azarDe(i * 31 + j * 7) < fija;
                    const ramp = ' .:-=+*#%@';
                    const k = listo ? Math.max(2, Math.min(9, Math.round(a * (.5 + luz * .5) * 9))) : 1 + Math.floor(azarDe(i + j * 57 + Math.floor(t * 14)) * 9);
                    ctx.fillStyle = listo ? `rgb(${r | 0},${g | 0},${b | 0})` : 'rgba(110,162,255,.45)';
                    ctx.fillText(ramp[k], ox + (i + .5) * cw, oy + (j + .5) * ch);
                }
                ctx.fillStyle = 'rgba(148,163,184,.75)'; ctx.font = '500 9px ui-monospace, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                ctx.fillText(`${cols}×${rows} ${ING ? 'CHARACTERS · RAMP' : 'CARACTERES · RAMPA'} " .:-=+*#%@"`, v.vx + 30, v.vy + v.vh - 9);
                ctx.restore();
            }

            if (e === 2) {
                // 3. VECTOR: contornos limpios, anclas, manijas y relleno final
                const v = ventana(sal);
                ctx.save(); ctx.globalAlpha = sal;
                const tr = sale(entre(p, 0, .45)), nod = entre(p, .25, .5) * (1 - entre(p, .82, .95)), rel = sale(entre(p, .55, .8));
                ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
                FORMAS.forEach(f => {
                    ctx.globalAlpha = sal * rel; ctx.fillStyle = f.claro; ctx.fill(f.ruta);
                    ctx.globalAlpha = sal * (1 - rel * .7);
                    ctx.strokeStyle = '#6ea2ff'; ctx.lineWidth = 1.4 / s;
                    ctx.setLineDash([800 * tr, 800]); ctx.stroke(f.ruta);
                });
                ctx.setLineDash([]);
                ctx.restore();
                if (nod > 0) {
                    ctx.globalAlpha = sal * nod;
                    FORMAS.forEach(f => {
                        ctx.strokeStyle = 'rgba(203,213,225,.7)'; ctx.lineWidth = 1;
                        f.manijas.forEach(([ax, ay, hx, hy]) => {
                            ctx.beginPath(); ctx.moveTo(X(ax), Y(ay)); ctx.lineTo(X(hx), Y(hy)); ctx.stroke();
                            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(hx), Y(hy), 2.4, 0, 7); ctx.fill();
                        });
                        f.anclas.forEach(([ax, ay]) => { ctx.fillStyle = '#fff'; ctx.fillRect(X(ax) - 2.5, Y(ay) - 2.5, 5, 5); ctx.strokeStyle = '#2f6bff'; ctx.strokeRect(X(ax) - 2.5, Y(ay) - 2.5, 5, 5); });
                    });
                }
                // caja de selección con sus ocho tiradores
                const sel = entre(p, .6, .72);
                if (sel) {
                    ctx.globalAlpha = sal * sel;
                    const bx = X(-6), by = Y(-6), bw = 248 * s, bh = 237 * s;
                    ctx.strokeStyle = '#6ea2ff'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([]);
                    [[0, 0], [.5, 0], [1, 0], [0, .5], [1, .5], [0, 1], [.5, 1], [1, 1]].forEach(([a, b]) => { ctx.fillStyle = '#0d1424'; ctx.fillRect(bx + a * bw - 3, by + b * bh - 3, 6, 6); ctx.strokeStyle = '#6ea2ff'; ctx.strokeRect(bx + a * bw - 3, by + b * bh - 3, 6, 6); });
                }
                // cursor que arrastra un nodo
                const cu = sale(entre(p, .3, .55));
                const cx = X(260 - 80 * cu), cy = Y(-20 + 140 * cu);
                ctx.globalAlpha = sal * (1 - entre(p, .85, .95));
                ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0d1424'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 13); ctx.lineTo(cx + 3.6, cy + 9.6); ctx.lineTo(cx + 6.4, cy + 15); ctx.lineTo(cx + 8.4, cy + 14); ctx.lineTo(cx + 5.8, cy + 8.8); ctx.lineTo(cx + 10, cy + 8.8); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.globalAlpha = sal;
                ctx.fillStyle = 'rgba(148,163,184,.75)'; ctx.font = '500 9px ui-monospace, monospace'; ctx.textAlign = 'left';
                ctx.fillText(`VECTOR · ${FORMAS.reduce((a, f) => a + f.anclas.length, 0)} ${ING ? 'NODES · INFINITELY SCALABLE' : 'NODOS · ESCALABLE AL INFINITO'}`, v.vx + 30, v.vy + v.vh - 9);
                ctx.restore();
            }

            if (e === 3) {
                // 4. DIGITAL: el logo en pantallas: sitio web, app en el teléfono y publicación en redes
                ctx.save();
                const base = Math.min(ent, sal);
                const llega = (k) => sale(entre(p, .03 + k * .1, .33 + k * .1));
                const bob = (k) => Math.sin(t * 1.3 + k * 2.1) * 2;
                // laptop con el sitio web
                {
                    const k = llega(0), w = Math.min(W * .56, H * 1.05), h = w * .62, x = W * .38 - w / 2, y = H * .1 + (1 - k) * 50 + bob(0);
                    ctx.globalAlpha = base * k;
                    redondo(x, y, w, h, 8); ctx.fillStyle = '#1e293b'; ctx.fill();
                    const sx = x + 6, sy = y + 6, sw = w - 12, sh = h - 12;
                    ctx.save(); redondo(sx, sy, sw, sh, 4); ctx.clip();
                    const gr = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh); gr.addColorStop(0, '#11214a'); gr.addColorStop(1, '#0a1120');
                    ctx.fillStyle = gr; ctx.fillRect(sx, sy, sw, sh);
                    ctx.fillStyle = '#1f2a40'; ctx.fillRect(sx, sy, sw, 12);
                    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx + 7 + i * 7, sy + 6, 2, 0, 7); ctx.fill(); });
                    redondo(sx + 32, sy + 3, sw * .5, 6, 3); ctx.fillStyle = '#2b3a57'; ctx.fill();
                    logo(sx + 9, sy + 17, 12 / 225, 1, true);
                    ctx.fillStyle = 'rgba(203,213,225,.5)'; for (let i = 0; i < 3; i++) ctx.fillRect(sx + sw - 66 + i * 20, sy + 21, 14, 3);
                    const hl = sh * .46; logo(sx + sw * .6, sy + sh * .3, hl / 225, 1, true);
                    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(sx + 12, sy + sh * .4, sw * .38, 6); ctx.fillRect(sx + 12, sy + sh * .4 + 10, sw * .28, 6);
                    ctx.fillStyle = 'rgba(148,163,184,.6)'; ctx.fillRect(sx + 12, sy + sh * .4 + 24, sw * .34, 3);
                    redondo(sx + 12, sy + sh * .4 + 34, 40, 11, 6); ctx.fillStyle = '#0B63F6'; ctx.fill();
                    ctx.restore();
                    ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.moveTo(x - 12, y + h); ctx.lineTo(x + w + 12, y + h); ctx.lineTo(x + w + 4, y + h + 6); ctx.lineTo(x - 4, y + h + 6); ctx.closePath(); ctx.fill();
                }
                // teléfono: el ícono de la app entre las demás
                {
                    const k = llega(1), ph = Math.min(H * .66, W * .36), pw = ph * .5, x = W * .82 - pw / 2, y = H * .08 + (1 - k) * 50 + bob(1);
                    ctx.globalAlpha = base * k;
                    redondo(x, y, pw, ph, 10); ctx.fillStyle = '#1e293b'; ctx.fill();
                    redondo(x + 3.5, y + 3.5, pw - 7, ph - 7, 7.5); ctx.fillStyle = '#0b1220'; ctx.fill();
                    redondo(x + pw / 2 - 9, y + 6, 18, 4, 2); ctx.fillStyle = '#1e293b'; ctx.fill();
                    const cel = (pw - 7) / 4, sz = cel * .68;
                    for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) {
                        const ix = x + 3.5 + i * cel + (cel - sz) / 2, iy = y + 16 + j * cel * 1.12;
                        redondo(ix, iy, sz, sz, sz * .26);
                        if (i === 1 && j === 1) {
                            const pul = 1 + Math.max(0, Math.sin(t * 2.4)) * .06;
                            ctx.save(); ctx.translate(ix + sz / 2, iy + sz / 2); ctx.scale(pul, pul); ctx.translate(-ix - sz / 2, -iy - sz / 2);
                            redondo(ix, iy, sz, sz, sz * .26); ctx.fillStyle = '#f8fafc'; ctx.shadowColor = 'rgba(11,99,246,.8)'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowColor = 'transparent';
                            logo(ix + sz * .16, iy + sz * .17, sz * .68 / 236);
                            ctx.restore();
                        } else { ctx.fillStyle = `hsla(${(i * 70 + j * 45) % 360},35%,50%,.28)`; ctx.fill(); }
                    }
                }
                // publicación en redes con su corazón
                {
                    const k = llega(2), s2 = Math.min(H * .4, W * .24), x = W * .62 - s2 / 2, y = H * .48 + (1 - k) * 50 + bob(2);
                    ctx.globalAlpha = base * k;
                    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
                    redondo(x, y, s2, s2 * 1.2, 8); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.shadowColor = 'transparent';
                    ctx.fillStyle = '#0B63F6'; ctx.beginPath(); ctx.arc(x + 10, y + 10, 5, 0, 7); ctx.fill();
                    ctx.fillStyle = '#94a3b8'; ctx.fillRect(x + 19, y + 8.5, s2 * .35, 3);
                    const gr = ctx.createLinearGradient(x, y + 20, x + s2, y + 20 + s2 * .8); gr.addColorStop(0, '#0B63F6'); gr.addColorStop(1, '#16284F');
                    ctx.fillStyle = gr; ctx.fillRect(x + 4, y + 20, s2 - 8, s2 * .78);
                    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(x + s2 / 2, y + 20 + s2 * .39, s2 * .22, 0, 7); ctx.fill();
                    logo(x + s2 / 2 - s2 * .125, y + 20 + s2 * .39 - s2 * .12, s2 * .25 / 236);
                    const lat = 1 + Math.max(0, Math.sin(t * 3)) * .3;
                    ctx.save(); ctx.translate(x + 11, y + s2 * 1.09); ctx.scale(lat * 1.3, lat * 1.3);
                    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(0, 2.5); ctx.bezierCurveTo(-5, -1.5, -3, -6, 0, -3); ctx.bezierCurveTo(3, -6, 5, -1.5, 0, 2.5); ctx.fill();
                    ctx.restore();
                    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x + 20, y + s2 * 1.09 - 1.5, s2 * .3, 3);
                }
                ctx.restore();
            }

            if (e === 4) {
                // 5. IMPRESIÓN: tarjeta, playera y cartel; marcas de corte y CMYK
                ctx.save(); ctx.globalAlpha = Math.min(ent, sal);
                const bob = (k) => Math.sin(t * 1.4 + k * 1.7) * 2.5;
                const llega = (k) => sale(entre(p, .04 + k * .1, .34 + k * .1));
                const U = Math.min(W / 3.3, H * .62);
                // tarjeta de presentación
                {
                    const k = llega(0), w = U * 1.05, h = w * .58, x = W * .2, y = H * .42 + (1 - k) * 60 + bob(0);
                    ctx.save(); ctx.globalAlpha *= k; ctx.translate(x, y); ctx.rotate(-.12);
                    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
                    ctx.fillStyle = '#f8fafc'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
                    logo(-w / 2 + h * .18, -h * .38, h * .4 / 225);
                    ctx.fillStyle = '#16284F'; ctx.fillRect(-w / 2 + h * .18, h * .2, w * .42, 3.5);
                    ctx.fillStyle = '#94a3b8'; ctx.fillRect(-w / 2 + h * .18, h * .3, w * .3, 2.5);
                    ctx.strokeStyle = 'rgba(203,213,225,.6)'; ctx.lineWidth = .8;
                    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
                        ctx.beginPath(); ctx.moveTo(a * (w / 2 + 3), b * h / 2); ctx.lineTo(a * (w / 2 + 11), b * h / 2);
                        ctx.moveTo(a * w / 2, b * (h / 2 + 3)); ctx.lineTo(a * w / 2, b * (h / 2 + 11)); ctx.stroke();
                    });
                    ctx.restore();
                }
                // playera
                {
                    const k = llega(1), w = U * .95, x = W * .52, y = H * .4 + (1 - k) * 60 + bob(1);
                    ctx.save(); ctx.globalAlpha *= k; ctx.translate(x, y); ctx.scale(w / 100, w / 100);
                    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
                    ctx.fillStyle = '#e2e8f0';
                    ctx.beginPath(); ctx.moveTo(-18, -52); ctx.quadraticCurveTo(0, -42, 18, -52); ctx.lineTo(48, -38); ctx.lineTo(40, -14); ctx.lineTo(30, -18);
                    ctx.lineTo(30, 52); ctx.lineTo(-30, 52); ctx.lineTo(-30, -18); ctx.lineTo(-40, -14); ctx.lineTo(-48, -38); ctx.closePath(); ctx.fill();
                    ctx.shadowColor = 'transparent';
                    ctx.strokeStyle = 'rgba(100,116,139,.35)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-18, -52); ctx.quadraticCurveTo(0, -38, 18, -52); ctx.stroke();
                    logo(-12, -22, 24 / 236);
                    ctx.restore();
                }
                // cartel / lona
                {
                    const k = llega(2), h = U * 1.15, w = h * .68, x = W * .82, y = H * .42 + (1 - k) * 60 + bob(2);
                    ctx.save(); ctx.globalAlpha *= k; ctx.translate(x, y); ctx.rotate(.06);
                    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
                    const gr = ctx.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#0B63F6'); gr.addColorStop(1, '#16284F');
                    ctx.fillStyle = gr; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
                    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, -h * .14, w * .32, 0, 7); ctx.fill();
                    logo(-w * .17, -h * .14 - w * .16, w * .34 / 236);
                    ctx.fillStyle = '#fff'; ctx.fillRect(-w * .3, h * .2, w * .6, 4);
                    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-w * .22, h * .29, w * .44, 2.5);
                    ctx.restore();
                }
                // CMYK y marca de registro
                const m = entre(p, .45, .6);
                if (m) {
                    ctx.globalAlpha = Math.min(ent, sal) * m;
                    ['#00aeef', '#ec008c', '#fff200', '#231f20'].forEach((col, k) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(14 + k * 13, H - 40, 5, 0, 7); ctx.fill(); });
                    ctx.strokeStyle = 'rgba(226,232,240,.8)'; ctx.lineWidth = 1;
                    const rx = W - 22, ry = H - 40;
                    ctx.beginPath(); ctx.arc(rx, ry, 6, 0, 7); ctx.moveTo(rx - 10, ry); ctx.lineTo(rx + 10, ry); ctx.moveTo(rx, ry - 10); ctx.lineTo(rx, ry + 10); ctx.stroke();
                }
                ctx.restore();
            }
        };
        const estatico = !mueve();
        if (estatico) { reloj = INICIO[2] + DUR[2] * .88; const fijo = () => { antes = null; caja.dataset.foco = ''; dibujar(0); }; fijo(); addEventListener('resize', fijo); }
        else bucle(caja, 60, dibujar);
        caja.closest('section')?.querySelectorAll('.service-list li[data-foco]').forEach(li => {
            li.addEventListener('pointerenter', () => { caja.dataset.foco = li.dataset.foco; if (estatico) dibujar(0); });
            li.addEventListener('pointerleave', () => { if (caja.dataset.foco === li.dataset.foco) delete caja.dataset.foco; if (estatico) { reloj = INICIO[2] + DUR[2] * .88; dibujar(0); } });
        });
    });

    // --- PROCESO DE UNA RED (Redes): plano → servidores → VLANs → firewall → Wi-Fi.
    // Al pasar el cursor por un servicio, la escena salta a la etapa que le toca.
    document.querySelectorAll('[data-red-proceso]').forEach(caja => {
        const c = lienzo('proceso-lienzo');
        caja.prepend(c);
        const ctx = c.getContext('2d');
        const pasos = [...caja.querySelectorAll('.proceso-pasos li')];
        const ING = raiz.lang === 'en';
        const DUR = [4.6, 4.4, 4.6, 4.6, 4.8], INICIO = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
        const TOTAL = DUR.reduce((a, b) => a + b, 0);
        const FOCO = { planos: 0, servidores: 1, vlans: 2, switch: 2, firewall: 3, wifi: 4 };
        const sale = (x) => 1 - Math.pow(1 - limitar(x), 3);
        const entre = (x, a, b) => limitar((x - a) / (b - a));
        const AZUL = '#6ea2ff', CIAN = '#22e1f0', VERDE = '#34d399', AMBAR = '#fbbf24', ROJO = '#f87171', VIOLETA = '#b39bff';
        let W = 0, H = 0, dpr = 1, reloj = 0, antes = null, etapaVista = -1;

        const medir = () => {
            dpr = Math.min(devicePixelRatio || 1, 2);
            const w = caja.clientWidth, h = caja.clientHeight;
            if (w !== W || h !== H) { W = w; H = h; c.width = w * dpr; c.height = h * dpr; }
        };
        const redondo = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
        const punto = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
        const rotulo = (txt, x, y, col = 'rgba(148,163,184,.8)', alin = 'left') => {
            ctx.fillStyle = col; ctx.font = '500 9px ui-monospace, Menlo, monospace'; ctx.textAlign = alin; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
        };
        const medidas = (pts) => { const l = []; let total = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); l.push(d); total += d; } return [l, total]; };
        // una línea que se dibuja de a poco (q de 0 a 1)
        const tramo = (pts, q, col, ancho = 1.2, guion = null) => {
            const [largos, total] = medidas(pts);
            let resta = total * limitar(q);
            if (resta <= 0) return;
            ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.setLineDash(guion || []);
            ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length && resta > 0; i++) {
                const f = Math.min(1, resta / (largos[i - 1] || 1));
                ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f);
                resta -= largos[i - 1];
            }
            ctx.stroke(); ctx.setLineDash([]);
        };
        // posición a lo largo de una polilínea (q de 0 a 1)
        const enRuta = (pts, q) => {
            const [largos, total] = medidas(pts);
            let d = total * limitar(q);
            for (let i = 1; i < pts.length; i++) {
                if (d <= largos[i - 1]) { const f = d / (largos[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; }
                d -= largos[i - 1];
            }
            return pts[pts.length - 1];
        };
        const equipo = (x, y, w, h, col, leds = 0, t = 0, semilla = 0) => {
            redondo(x - w / 2, y - h / 2, w, h, 3); ctx.fillStyle = '#111a2e'; ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
            for (let k = 0; k < leds; k++) punto(x - w / 2 + 6 + k * 5, y, 1.3, azarDe(semilla + k * 7 + Math.floor(t * 7)) > .45 ? col : 'rgba(148,163,184,.25)');
        };
        // planta de oficina compartida por el plano y el Wi-Fi
        const planta = (x0, y0, w, h) => {
            const P = (u, v) => [x0 + u * w, y0 + v * h];
            return {
                P,
                muros: [
                    [P(0, 0), P(1, 0), P(1, 1), P(0, 1), P(0, 0)],
                    [P(.42, 0), P(.42, .38)], [P(.42, .55), P(.42, 1)],
                    [P(.42, .5), P(.72, .5)], [P(.84, .5), P(1, .5)],
                    [P(0, .62), P(.18, .62)], [P(.28, .62), P(.42, .62)],
                ],
            };
        };

        const dibujar = (tAbs) => {
            medir();
            if (!W || !H) return;
            const dt = antes === null ? 0 : Math.min(tAbs - antes, .1);
            antes = tAbs;
            const foco = FOCO[caja.dataset.foco];
            if (foco !== undefined) reloj = INICIO[foco] + DUR[foco] * .8;
            else reloj = (reloj + dt) % TOTAL;
            let e = 0; while (e < 4 && reloj >= INICIO[e + 1]) e++;
            const p = (reloj - INICIO[e]) / DUR[e];
            if (e !== etapaVista) { etapaVista = e; pasos.forEach((li, k) => li.classList.toggle('activo', k === e)); }
            const alfa = Math.min(sale(entre(p, 0, .1)), 1 - entre(p, .92, 1));
            const t = tAbs;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.save(); ctx.globalAlpha = alfa;
            const zona = { x: W * .04, y: H * .03, w: W * .92, h: H * .84 };

            if (e === 0) {
                // 1. PLANO: papel azul de plano, muros, equipos y cableado propuesto
                redondo(zona.x, zona.y, zona.w, zona.h, 10); ctx.fillStyle = '#0a2350'; ctx.fill();
                ctx.save(); ctx.clip();
                ctx.strokeStyle = 'rgba(147,197,253,.10)'; ctx.lineWidth = 1;
                for (let x = zona.x; x < zona.x + zona.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, zona.y); ctx.lineTo(x, zona.y + zona.h); ctx.stroke(); }
                for (let y = zona.y; y < zona.y + zona.h; y += 12) { ctx.beginPath(); ctx.moveTo(zona.x, y); ctx.lineTo(zona.x + zona.w, y); ctx.stroke(); }
                ctx.restore();
                const pl = planta(zona.x + 18, zona.y + 18, zona.w - 36, zona.h - 46);
                const m = entre(p, .05, .4);
                pl.muros.forEach((mu, k) => tramo(mu, entre(m, k * .08, k * .08 + .45), 'rgba(226,240,255,.9)', 1.6));
                const sw = pl.P(.21, .3), dispositivos = [[pl.P(.12, .82), 'PC'], [pl.P(.3, .82), 'PC'], [pl.P(.6, .22), 'AP'], [pl.P(.6, .78), 'CAM'], [pl.P(.9, .25), 'AP'], [pl.P(.9, .78), 'POS']];
                const d = entre(p, .35, .55);
                if (d) {
                    ctx.globalAlpha = alfa * d;
                    equipo(sw[0], sw[1], 34, 12, CIAN, 4, t, 3); rotulo('SW-01', sw[0], sw[1] - 13, 'rgba(186,230,253,.9)', 'center');
                    dispositivos.forEach(([q, n]) => { punto(q[0], q[1], 4, '#0a2350'); ctx.strokeStyle = 'rgba(226,240,255,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.stroke(); rotulo(n, q[0], q[1] + 10, 'rgba(186,230,253,.8)', 'center'); });
                    ctx.globalAlpha = alfa;
                }
                const cab = entre(p, .5, .85);
                dispositivos.forEach(([q], k) => {
                    const ruta = [[sw[0], sw[1] + 6], [sw[0], q[1] - 14 + (k % 2) * 4], [q[0], q[1] - 14 + (k % 2) * 4], [q[0], q[1] - 4]];
                    tramo(ruta, entre(cab, k * .1, k * .1 + .5), 'rgba(34,225,240,.85)', 1, [4, 3]);
                });
                rotulo(ING ? 'NETWORK-PLAN-01 · SCALE 1:100' : 'PLANO-RED-01 · ESC 1:100', zona.x + 14, zona.y + zona.h - 12, 'rgba(186,230,253,.75)');
                rotulo(`CAT6 · ${Math.round(cab * 148)} m`, zona.x + zona.w - 14, zona.y + zona.h - 12, 'rgba(186,230,253,.75)', 'right');
            }

            if (e === 1) {
                // 2. SERVIDORES: un rack donde cada equipo entra en su lugar y enciende
                const rw = Math.min(W * .42, 170), rh = zona.h * .96, rx = W * .36 - rw / 2, ry = zona.y + zona.h * .02;
                redondo(rx - 8, ry, rw + 16, rh, 6); ctx.fillStyle = '#0c1220'; ctx.fill(); ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 1; ctx.stroke();
                const U = 11, alto = (rh - 16) / U;
                for (let k = 0; k <= U; k++) { ctx.fillStyle = 'rgba(148,163,184,.25)'; ctx.fillRect(rx - 5, ry + 8 + k * alto - .5, 2, 1); ctx.fillRect(rx + rw + 3, ry + 8 + k * alto - .5, 2, 1); }
                const piezas = [
                    { u: 0, n: 1, tipo: 'patch', col: AMBAR }, { u: 1, n: 1, tipo: 'switch', col: CIAN }, { u: 2, n: 1, tipo: 'switch', col: CIAN },
                    { u: 3, n: 1, tipo: 'fw', col: ROJO }, { u: 5, n: 2, tipo: 'srv', col: VERDE }, { u: 7, n: 2, tipo: 'srv', col: VERDE }, { u: 9, n: 2, tipo: 'nas', col: VIOLETA },
                ];
                piezas.forEach((pz, k) => {
                    const q = sale(entre(p, .05 + k * .07, .22 + k * .07));
                    if (!q) return;
                    const y = ry + 8 + pz.u * alto + 1, h = pz.n * alto - 2, x = rx + (1 - q) * (W - rx);
                    redondo(x, y, rw, h, 2); ctx.fillStyle = '#16213a'; ctx.fill(); ctx.strokeStyle = 'rgba(148,163,184,.4)'; ctx.stroke();
                    const encendido = q > .98;
                    if (pz.tipo === 'patch' || pz.tipo === 'switch') {
                        for (let i = 0; i < 12; i++) {
                            const px = x + 8 + i * (rw - 34) / 12;
                            ctx.fillStyle = '#0b1120'; ctx.fillRect(px, y + h / 2 - 2.5, 5, 5);
                            if (encendido && pz.tipo === 'switch') punto(px + 2.5, y + h / 2 - 4.5, .9, azarDe(i * 13 + k + Math.floor(t * 9)) > .4 ? pz.col : 'rgba(148,163,184,.2)');
                        }
                    } else {
                        for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(148,163,184,.12)'; ctx.fillRect(x + rw * .4 + i * 9, y + 3, 6, h - 6); }
                        if (encendido) { punto(x + 8, y + h / 2, 1.8, pz.col); punto(x + 15, y + h / 2, 1.4, azarDe(k * 9 + Math.floor(t * 6)) > .3 ? AZUL : 'rgba(148,163,184,.2)'); }
                    }
                    if (encendido) rotulo({ patch: 'PATCH', switch: 'SW', fw: 'FW', srv: 'SRV', nas: 'NAS' }[pz.tipo], x + rw - 6, y + h / 2, 'rgba(203,213,225,.7)', 'right');
                });
                // estado a la derecha
                const lineas = ING ? ['$ provision --plan', '✓ firewall', '✓ core switches', '✓ servers', '✓ backups'] : ['$ provision --plan', '✓ firewall', '✓ switches', '✓ servidores', '✓ respaldos'];
                const vis = Math.floor(entre(p, .3, .8) * lineas.length + .001);
                const tx = rx + rw + 22;
                lineas.slice(0, vis).forEach((l, k) => rotulo(l, tx, ry + 22 + k * 15, k ? VERDE : 'rgba(203,213,225,.85)'));
                if (p > .82) { punto(tx + 3, ry + rh - 10, 3, VERDE); rotulo('ONLINE', tx + 11, ry + rh - 10, VERDE); }
            }

            if (e === 2) {
                // 3. VLANs: cada área en su segmento; un paquete que intenta cruzar es rechazado
                const sw = [W / 2, zona.y + 14];
                const grupos = [[ING ? 'VLAN 10 POS' : 'VLAN 10 CAJA', CIAN], [ING ? 'VLAN 20 OFFICE' : 'VLAN 20 OFICINA', AZUL], [ING ? 'VLAN 30 CCTV' : 'VLAN 30 CÁMARAS', VIOLETA], [ING ? 'VLAN 40 GUESTS' : 'VLAN 40 INVITADOS', AMBAR]];
                const gw = zona.w / 4, bus = sw[1] + 26;
                const ap = sale(entre(p, .02, .25));
                grupos.forEach(([nombre, col], g) => {
                    const gx = zona.x + g * gw + 3, gy = zona.y + zona.h * .4, ancho = gw - 6, alto = zona.h * .58;
                    const bx = gx + ancho / 2;
                    tramo([[sw[0], sw[1] + 7], [sw[0], bus], [bx, bus], [bx, gy]], entre(p, .08 + g * .04, .3 + g * .04), col, 1.3);
                    ctx.globalAlpha = alfa * ap;
                    redondo(gx, gy, ancho, alto, 8); ctx.fillStyle = col + '14'; ctx.fill();
                    ctx.setLineDash([3, 3]); ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
                    const [n1, n2] = nombre.split(' ').length > 2 ? [nombre.split(' ').slice(0, 2).join(' '), nombre.split(' ').slice(2).join(' ')] : [nombre, ''];
                    rotulo(n1, bx, gy + alto - 22, col, 'center'); rotulo(n2, bx, gy + alto - 10, col, 'center');
                    for (let h = 0; h < 3; h++) {
                        const hx = gx + ancho * (.2 + h * .3), hy = gy + alto * .42;
                        ctx.strokeStyle = col + '88'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy - 5); ctx.lineTo(hx, gy + 10); ctx.lineTo(bx, gy + 10); ctx.lineTo(bx, gy); ctx.stroke();
                        redondo(hx - 6, hy - 5, 12, 10, 2); ctx.fillStyle = '#111a2e'; ctx.fill(); ctx.strokeStyle = col; ctx.stroke();
                        // tráfico dentro de su propia VLAN
                        if (p > .3) {
                            const q = (t * .5 + h * .33 + g * .21) % 1;
                            const pos = enRuta([[hx, hy - 5], [hx, gy + 10], [bx, gy + 10], [bx, bus], [sw[0], bus], [sw[0], sw[1] + 7]], q);
                            punto(pos[0], pos[1], 2, col);
                        }
                    }
                    ctx.globalAlpha = alfa;
                });
                equipo(sw[0], sw[1], 74, 14, CIAN, 11, t, 11);
                // intento de cruce: invitados → caja, bloqueado en el switch
                const ic = entre(p, .45, .85);
                if (ic > 0 && ic < 1) {
                    const desde = [zona.x + 3 * gw + gw / 2, zona.y + zona.h * .4], hacia = [zona.x + gw / 2, zona.y + zona.h * .4];
                    const ruta = [desde, [desde[0], bus], [hacia[0], bus], hacia];
                    const q = Math.min(ic * 1.5, .5);
                    const pos = enRuta(ruta, q);
                    punto(pos[0], pos[1], 3.2, AMBAR);
                    if (ic * 1.5 > .5) {
                        const k = sale(entre(ic * 1.5, .5, .8));
                        ctx.strokeStyle = ROJO; ctx.lineWidth = 2; const s = 3 + k * 4;
                        ctx.beginPath(); ctx.moveTo(pos[0] - s, pos[1] - s); ctx.lineTo(pos[0] + s, pos[1] + s); ctx.moveTo(pos[0] + s, pos[1] - s); ctx.lineTo(pos[0] - s, pos[1] + s); ctx.stroke();
                        ctx.globalAlpha = alfa * k;
                        redondo(pos[0] - 62, pos[1] + 9, 124, 14, 7); ctx.fillStyle = 'rgba(127,29,29,.9)'; ctx.fill();
                        rotulo(ING ? 'DENIED · inter-VLAN' : 'DENEGADO · entre VLANs', pos[0], pos[1] + 16, '#fecaca', 'center');
                        ctx.globalAlpha = alfa;
                    }
                }
            }

            if (e === 3) {
                // 4. FIREWALL: lo de fuera rebota en el muro; la VPN de la sucursal pasa por su túnel
                const muroX = W * .5, top = zona.y + 18, bot = zona.y + zona.h - 4;
                const nube = [W * .15, H * .26];
                ctx.fillStyle = 'rgba(148,163,184,.2)';
                [[0, 0, 15], [13, -6, 12], [-13, -4, 11], [24, 4, 9], [-22, 6, 8]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(nube[0] + dx, nube[1] + dy, r, 0, 7); ctx.fill(); });
                rotulo('INTERNET', nube[0], nube[1] + 24, 'rgba(203,213,225,.8)', 'center');
                // muro de ladrillos que se levanta
                const sube = sale(entre(p, .02, .25));
                const filas = 10, lh = (bot - top) / filas;
                for (let f = 0; f < filas; f++) {
                    if (f / filas >= sube) break;
                    const y = bot - (f + 1) * lh, des = f % 2 ? 7 : 0;
                    ctx.fillStyle = f % 2 ? '#c2410c' : '#b13c0b'; ctx.fillRect(muroX - 20, y + 1, 40, lh - 2);
                    ctx.fillStyle = '#05070d';
                    for (let k = 0; k < 3; k++) { const mx = muroX - 20 + des + 6 + k * 14; if (mx > muroX - 19 && mx < muroX + 19) ctx.fillRect(mx, y + 1, 1.5, lh - 2); }
                }
                if (sube > .95) {
                    const pul = 1 + Math.sin(t * 3) * .05;
                    ctx.save(); ctx.translate(muroX, top - 8); ctx.scale(pul, pul);
                    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = ROJO; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, -4.5); ctx.quadraticCurveTo(8, 6, 0, 10); ctx.quadraticCurveTo(-8, 6, -8, -4.5); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.restore();
                }
                // oficina
                const of = [W * .83, H * .3];
                equipo(of[0], of[1], 46, 26, AZUL, 0); rotulo(ING ? 'OFFICE' : 'OFICINA', of[0], of[1] + 22, 'rgba(203,213,225,.8)', 'center');
                for (let k = 0; k < 3; k++) punto(of[0] - 12 + k * 12, of[1], 2, azarDe(k + Math.floor(t * 3)) > .3 ? VERDE : 'rgba(148,163,184,.3)');
                // ataques que rebotan
                let bloqueados = 0;
                for (let n = 0; n < 7; n++) {
                    const ciclo = 1.6, q = ((t + n * .37) % ciclo) / ciclo;
                    bloqueados += Math.floor((t + n * .37) / ciclo);
                    if (p < .22) continue;
                    const y0 = nube[1] + (azarDe(n * 3) - .5) * 20, y1 = top + 10 + azarDe(n * 5) * (bot - top - 40);
                    let x, y, a = 1;
                    if (q < .6) { const k = q / .6; x = nube[0] + 22 + (muroX - 22 - nube[0] - 22) * k; y = y0 + (y1 - y0) * k; }
                    else {
                        const k = (q - .6) / .4; x = muroX - 22 - k * 26; y = y1 + k * 16; a = 1 - k;
                        ctx.strokeStyle = `rgba(248,113,113,${(1 - k) * .8})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(muroX - 20, y1, 3 + k * 9, 0, 7); ctx.stroke();
                    }
                    ctx.globalAlpha = alfa * a; punto(x, y, 2.4, ROJO); ctx.globalAlpha = alfa;
                }
                // túnel VPN desde la sucursal, que atraviesa el muro
                const suc = [W * .15, H * .7], tunel = [[suc[0] + 20, suc[1]], [of[0], suc[1]], [of[0], of[1] + 14]];
                equipo(suc[0], suc[1], 34, 20, VERDE, 0); rotulo(ING ? 'BRANCH' : 'SUCURSAL', suc[0], suc[1] + 18, 'rgba(203,213,225,.8)', 'center');
                const tv = entre(p, .3, .55);
                if (tv) {
                    ctx.globalAlpha = alfa * tv;
                    ctx.strokeStyle = 'rgba(52,211,153,.22)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                    ctx.beginPath(); tunel.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.lineCap = 'butt';
                    tramo(tunel, tv, VERDE, 1, [5, 4]);
                    const lx = (suc[0] + muroX) / 2 - 6, ly = suc[1] - 13;
                    ctx.strokeStyle = VERDE; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(lx, ly - 2, 3.5, Math.PI, 0); ctx.stroke(); ctx.fillStyle = VERDE; ctx.fillRect(lx - 5, ly - 2, 10, 7);
                    for (let n = 0; n < 3; n++) { const pos = enRuta(tunel, (t * .4 + n / 3) % 1); punto(pos[0], pos[1], 2.4, '#a7f3d0'); }
                    ctx.globalAlpha = alfa;
                    rotulo('VPN · WireGuard', (muroX + of[0]) / 2 + 6, suc[1] - 12, VERDE, 'center');
                }
                rotulo(`${ING ? 'BLOCKED' : 'BLOQUEADOS'}: ${(12840 + bloqueados).toLocaleString(ING ? 'en-US' : 'es-MX')}`, zona.x + zona.w - 2, zona.y + 6, ROJO, 'right');
            }

            if (e === 4) {
                // 5. WI-FI: puntos de acceso con su cobertura y un teléfono que recorre la oficina sin perder señal
                const x0 = zona.x + 10, y0 = zona.y + 6, pw = zona.w - 20, ph = zona.h - 24;
                const pl = planta(x0, y0, pw, ph);
                const aps = [pl.P(.2, .3), pl.P(.72, .25), pl.P(.64, .8)];
                const cob = sale(entre(p, .08, .45));
                ctx.save();
                ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
                ctx.globalCompositeOperation = 'lighter';
                aps.forEach(([x, y], k) => {
                    const r = pw * .36 * cob;
                    if (r < 1) return;
                    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                    g.addColorStop(0, 'rgba(52,211,153,.38)'); g.addColorStop(.55, 'rgba(250,204,21,.13)'); g.addColorStop(1, 'rgba(248,113,113,0)');
                    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
                    for (let w = 0; w < 3; w++) {
                        const q = (t * .45 + w / 3 + k * .2) % 1;
                        ctx.strokeStyle = `rgba(110,231,183,${(1 - q) * .4 * cob})`; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.arc(x, y, 6 + q * r * .75, 0, 7); ctx.stroke();
                    }
                });
                ctx.restore();
                pl.muros.forEach((mu) => tramo(mu, 1, 'rgba(203,213,225,.55)', 1.4));
                aps.forEach(([x, y], k) => { redondo(x - 8, y - 4, 16, 8, 4); ctx.fillStyle = '#e2e8f0'; ctx.fill(); punto(x, y, 1.6, azarDe(k + Math.floor(t * 4)) > .3 ? '#059669' : '#94a3b8'); rotulo(`AP-0${k + 1}`, x, y - 11, 'rgba(226,232,240,.9)', 'center'); });
                if (p > .25) {
                    const ruta = [pl.P(.08, .85), pl.P(.3, .85), pl.P(.34, .46), pl.P(.55, .38), pl.P(.9, .36), pl.P(.88, .8), pl.P(.5, .9), pl.P(.08, .85)];
                    const pos = enRuta(ruta, (t * .07) % 1);
                    const cerca = Math.max(...aps.map(([x, y]) => 1 - Math.hypot(x - pos[0], y - pos[1]) / (pw * .45)));
                    const barras = Math.max(2, Math.min(4, Math.round(cerca * 4 + 1.5)));
                    redondo(pos[0] - 5, pos[1] - 8, 10, 16, 2.5); ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.stroke();
                    for (let b = 0; b < 4; b++) { ctx.fillStyle = b < barras ? VERDE : 'rgba(148,163,184,.3)'; ctx.fillRect(pos[0] + 8 + b * 3, pos[1] + 4 - (3 + b * 2), 2, 3 + b * 2); }
                }
                rotulo(ING ? 'COVERAGE −65 dBm · ROAMING 802.11r' : 'COBERTURA −65 dBm · ROAMING 802.11r', x0, zona.y + zona.h - 6, 'rgba(110,231,183,.85)');
            }
            ctx.restore();
        };
        const estatico = !mueve();
        if (estatico) { reloj = INICIO[2] + DUR[2] * .8; const fijo = () => { antes = null; dibujar(0); }; fijo(); addEventListener('resize', fijo); }
        else bucle(caja, 60, dibujar);
        caja.closest('section')?.querySelectorAll('.service-list li[data-foco]').forEach(li => {
            li.addEventListener('pointerenter', () => { caja.dataset.foco = li.dataset.foco; if (estatico) dibujar(0); });
            li.addEventListener('pointerleave', () => { if (caja.dataset.foco === li.dataset.foco) delete caja.dataset.foco; if (estatico) { reloj = INICIO[2] + DUR[2] * .8; dibujar(0); } });
        });
    });

    // --- SERVICIO TÉCNICO: un equipo de principio a fin. Diagnóstico térmico, limpieza, armado, firmware y entrega.
    // El servicio bajo el cursor salta a su etapa; sin movimiento queda fijo en el armado.
    document.querySelectorAll('[data-tecnico-proceso]').forEach(caja => {
        const c = lienzo('proceso-lienzo');
        caja.prepend(c);
        const ctx = c.getContext('2d');
        const pasos = [...caja.querySelectorAll('.proceso-pasos li')];
        const ING = raiz.lang === 'en';
        const DUR = [4.6, 4.8, 5.2, 4.6, 4.8], INICIO = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
        const TOTAL = DUR.reduce((a, b) => a + b, 0);
        const FOCO = { servidores: 0, hardware: 1, armado: 2, firmware: 3, impresoras: 4, graphene: 4 };
        const sale = (x) => 1 - Math.pow(1 - limitar(x), 3);
        const entre = (x, a, b) => limitar((x - a) / (b - a));
        const AZUL = '#6ea2ff', CIAN = '#22e1f0', VERDE = '#34d399', AMBAR = '#fbbf24', ROJO = '#f87171';
        const L = ING
            ? { fallas: '2 FAULTS FOUND', ok: 'OK', temp: 'CPU TEMP', piezas: ['CPU', 'Cooler', 'Memory 2×16 GB', 'Graphics card', 'NVMe SSD 1 TB', 'PSU 750 W Gold', 'Cabling'], post: 'POST OK · BOOT 9 s', fw: 'UEFI · FIRMWARE UPDATE', noApagar: 'DO NOT POWER OFF', verif: 'VERIFIED · SHA-256 ✓', estres: 'STRESS 30 min ✓', listo: 'TESTED · READY FOR PICKUP ✓', antes: 'before', despues: 'after', limpio: 'DUST · PASTE · FANS', diag: '$ diag --full' }
            : { fallas: '2 FALLAS ENCONTRADAS', ok: 'OK', temp: 'TEMP. CPU', piezas: ['Procesador', 'Disipador', 'Memoria 2×16 GB', 'Tarjeta de video', 'SSD NVMe 1 TB', 'Fuente 750 W Gold', 'Cableado'], post: 'POST OK · ARRANQUE 9 s', fw: 'UEFI · ACTUALIZACIÓN DE FIRMWARE', noApagar: 'NO APAGUES EL EQUIPO', verif: 'VERIFICADO · SHA-256 ✓', estres: 'ESTRÉS 30 min ✓', listo: 'PROBADO · LISTO PARA ENTREGA ✓', antes: 'antes', despues: 'después', limpio: 'POLVO · PASTA · VENTILADORES', diag: '$ diag --completo' };
        let W = 0, H = 0, dpr = 1, reloj = 0, antes = null, etapaVista = -1;

        const medir = () => {
            dpr = Math.min(devicePixelRatio || 1, 2);
            const w = caja.clientWidth, h = caja.clientHeight;
            if (w !== W || h !== H) { W = w; H = h; c.width = w * dpr; c.height = h * dpr; }
        };
        const redondo = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
        const punto = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
        const rotulo = (txt, x, y, col = 'rgba(148,163,184,.8)', alin = 'left', tam = 9) => {
            ctx.fillStyle = col; ctx.font = `500 ${tam}px ui-monospace, Menlo, monospace`; ctx.textAlign = alin; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
        };
        const caja2 = (x, y, w, h, r, relleno, borde, ancho = 1) => { redondo(x, y, w, h, r); if (relleno) { ctx.fillStyle = relleno; ctx.fill(); } if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = ancho; ctx.stroke(); } };
        const ventilador = (x, y, r, giro, col = 'rgba(203,213,225,.75)', roto = false) => {
            ctx.strokeStyle = roto ? ROJO : col; ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
            ctx.fillStyle = roto ? 'rgba(248,113,113,.35)' : 'rgba(148,163,184,.35)';
            for (let k = 0; k < 5; k++) {
                const a = giro + k * Math.PI * 2 / 5;
                ctx.beginPath(); ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + Math.cos(a + .5) * r * .9, y + Math.sin(a + .5) * r * .9, x + Math.cos(a + .9) * r * .82, y + Math.sin(a + .9) * r * .82);
                ctx.lineTo(x + Math.cos(a + .25) * r * .3, y + Math.sin(a + .25) * r * .3); ctx.fill();
            }
            punto(x, y, r * .22, roto ? ROJO : '#cbd5e1');
        };
        const paloma = (x, y, s, col = VERDE) => { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * .3, y + s * .7); ctx.lineTo(x + s, y - s * .7); ctx.stroke(); };

        // Geometría del gabinete abierto, en coordenadas relativas (u, v)
        const torre = (x, y, w, h) => {
            const A = (u, v) => [x + u * w, y + v * h];
            return {
                A, w, h,
                placa: [A(.07, .05), w * .7, h * .62],
                cpu: [A(.27, .14), w * .17],
                ram: [[A(.58, .09), w * .035, h * .3], [A(.64, .09), w * .035, h * .3]],
                gpu: [A(.1, .47), w * .64, h * .085],
                ssd: [A(.13, .38), w * .15, h * .024],
                psu: [A(.06, .79), w * .44, h * .14],
                fans: [A(.9, .19), A(.9, .41), A(.9, .63)],
                fr: Math.min(w * .075, h * .06),
            };
        };
        const dibujaCaja = (g) => {
            const [x, y] = g.A(0, 0);
            caja2(x, y, g.w, g.h, 8, '#0b1220', 'rgba(148,163,184,.55)', 1.4);
            ctx.strokeStyle = 'rgba(148,163,184,.18)'; ctx.lineWidth = 1;
            const [bx, by] = g.A(.6, .77); ctx.strokeRect(bx, by, g.w * .32, g.h * .17);
            for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(bx, by + k * g.h * .057); ctx.lineTo(bx + g.w * .32, by + k * g.h * .057); ctx.stroke(); }
        };
        const dibujaPlaca = (g, k = 1) => {
            const [[px, py], pw, ph] = g.placa;
            ctx.save(); ctx.globalAlpha *= k;
            caja2(px, py, pw, ph, 4, '#0f2233', 'rgba(110,162,255,.45)');
            ctx.strokeStyle = 'rgba(110,162,255,.13)'; ctx.lineWidth = 1;
            for (let i = 0; i < 9; i++) { const yy = py + ph * (.08 + i * .1); ctx.beginPath(); ctx.moveTo(px + pw * .05, yy); ctx.lineTo(px + pw * (.3 + azarDe(i) * .5), yy); ctx.stroke(); }
            const [[cx, cy], cs] = g.cpu; ctx.strokeStyle = 'rgba(110,162,255,.5)'; ctx.strokeRect(cx - 3, cy - 3, cs + 6, cs + 6);
            g.ram.forEach(([[rx, ry], rw, rh]) => { ctx.strokeStyle = 'rgba(110,162,255,.35)'; ctx.strokeRect(rx - 1, ry - 2, rw + 2, rh + 4); });
            ctx.restore();
        };
        const dibujaCpu = (g, dx = 0, dy = 0) => { const [[cx, cy], cs] = g.cpu; caja2(cx + dx, cy + dy, cs, cs, 2, '#cbd5e1', null); caja2(cx + dx + cs * .2, cy + dy + cs * .2, cs * .6, cs * .6, 1, '#94a3b8', null); };
        const dibujaDisipador = (g, dx = 0, dy = 0, giro = 0) => {
            const [[cx, cy], cs] = g.cpu, m = cs * .22;
            caja2(cx - m + dx, cy - m + dy, cs + m * 2, cs + m * 2, 3, '#1e293b', 'rgba(203,213,225,.6)');
            ventilador(cx + cs / 2 + dx, cy + cs / 2 + dy, cs * .62, giro);
        };
        const dibujaRam = (g, i, dy = 0) => {
            const [[rx, ry], rw, rh] = g.ram[i];
            caja2(rx, ry + dy, rw, rh, 1, '#065f46', 'rgba(52,211,153,.8)');
            for (let k = 0; k < 4; k++) { ctx.fillStyle = '#0b1220'; ctx.fillRect(rx + rw * .2, ry + dy + rh * (.08 + k * .23), rw * .6, rh * .15); }
        };
        const dibujaGpu = (g, dx = 0, giro = 0) => {
            const [[gx, gy], gw, gh] = g.gpu;
            caja2(gx + dx, gy, gw, gh, 3, '#1e293b', 'rgba(203,213,225,.65)');
            ventilador(gx + dx + gw * .3, gy + gh / 2, gh * .4, giro); ventilador(gx + dx + gw * .7, gy + gh / 2, gh * .4, -giro);
        };
        const dibujaSsd = (g, dx = 0) => { const [[sx, sy], sw, sh] = g.ssd; caja2(sx + dx, sy, sw, sh, 1, '#0f172a', CIAN); };
        const dibujaPsu = (g, dy = 0) => {
            const [[qx, qy], qw, qh] = g.psu;
            caja2(qx, qy + dy, qw, qh, 3, '#111827', 'rgba(203,213,225,.6)');
            ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 1;
            for (let k = 0; k < 6; k++) { const xx = qx + qw * (.45 + k * .08); ctx.beginPath(); ctx.moveTo(xx, qy + dy + qh * .2); ctx.lineTo(xx, qy + dy + qh * .8); ctx.stroke(); }
            rotulo('750W', qx + qw * .08, qy + dy + qh / 2, 'rgba(203,213,225,.7)', 'left', 8);
        };
        const dibujaFans = (g, giro, roto = -1) => g.fans.forEach(([fx, fy], k) => ventilador(fx, fy, g.fr, k === roto ? .4 : giro + k, undefined, k === roto));
        const equipoCompleto = (g, giro, roto = -1) => {
            dibujaCaja(g); dibujaPlaca(g); dibujaCpu(g); dibujaSsd(g); dibujaRam(g, 0); dibujaRam(g, 1); dibujaPsu(g); dibujaGpu(g, 0, giro * 1.3);
            dibujaDisipador(g, 0, 0, giro); dibujaFans(g, giro, roto);
        };
        // Dónde va el gabinete y dónde el panel lateral
        const reparto = (zona) => {
            const th = zona.h - 6, tw = Math.min(th * .66, zona.w * .44);
            const g = torre(zona.x + 4, zona.y + 3, tw, th);
            const px = zona.x + tw + 22;
            return { g, px, pw: zona.x + zona.w - px };
        };
        // Partículas de polvo con el momento en que la boquilla de aire pasa sobre ellas
        const POLVO = Array.from({ length: 110 }, (_, i) => ({ u: .08 + azarDe(i) * .8, v: .06 + azarDe(i + 400) * .86, r: .7 + azarDe(i + 900) * 1.3 }));
        const RUTA_AIRE = [[.05, .08], [.92, .14], [.08, .3], [.92, .38], [.08, .52], [.92, .6], [.08, .75], [.92, .9]];
        const enRutaRel = (q) => {
            const n = RUTA_AIRE.length - 1, f = limitar(q) * n, i = Math.min(n - 1, Math.floor(f)), r = f - i;
            return [RUTA_AIRE[i][0] + (RUTA_AIRE[i + 1][0] - RUTA_AIRE[i][0]) * r, RUTA_AIRE[i][1] + (RUTA_AIRE[i + 1][1] - RUTA_AIRE[i][1]) * r];
        };
        POLVO.forEach(m => {
            let mejor = 1e9;
            for (let s = 0; s <= 140; s++) { const [u, v] = enRutaRel(s / 140), d = Math.hypot(u - m.u, (v - m.v) * 1.4); if (d < mejor) { mejor = d; m.q = s / 140; } }
        });

        const dibujar = (tAbs) => {
            medir();
            if (!W || !H) return;
            const dt = antes === null ? 0 : Math.min(tAbs - antes, .1);
            antes = tAbs;
            const foco = FOCO[caja.dataset.foco];
            if (foco !== undefined) reloj = INICIO[foco] + DUR[foco] * .9;
            else reloj = (reloj + dt) % TOTAL;
            let e = 0; while (e < 4 && reloj >= INICIO[e + 1]) e++;
            const p = (reloj - INICIO[e]) / DUR[e];
            if (e !== etapaVista) { etapaVista = e; pasos.forEach((li, k) => li.classList.toggle('activo', k === e)); }
            const alfa = Math.min(sale(entre(p, 0, .1)), 1 - entre(p, .92, 1));
            const t = tAbs;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.save(); ctx.globalAlpha = alfa;
            const zona = { x: W * .04, y: H * .03, w: W * .92, h: H * .84 };
            const giro = t * 9;

            if (e === 0) {
                // 1. DIAGNÓSTICO: barrido térmico que revela el calor y una lista de pruebas
                const { g, px, pw } = reparto(zona);
                equipoCompleto(g, giro, 1);
                const [gx, gy] = g.A(0, 0);
                const barre = sale(entre(p, .06, .55)), sy = gy + g.h * barre;
                const [[cx, cy], cs] = g.cpu, [[ux, uy], uw, uh] = g.gpu;
                if (barre > 0) {
                    ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, g.w, sy - gy); ctx.clip();
                    const calor = (x, y, r, a) => { const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(248,113,113,${a})`); gr.addColorStop(.45, `rgba(251,191,36,${a * .55})`); gr.addColorStop(1, 'rgba(59,130,246,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
                    ctx.fillStyle = 'rgba(30,64,175,.22)'; ctx.fillRect(gx, gy, g.w, g.h);
                    calor(cx + cs / 2, cy + cs / 2, cs * 1.6, .75 + Math.sin(t * 5) * .08);
                    calor(ux + uw * .5, uy + uh / 2, uw * .42, .5);
                    ctx.restore();
                }
                if (barre < 1) { ctx.save(); ctx.strokeStyle = CIAN; ctx.lineWidth = 1.5; ctx.shadowColor = CIAN; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(gx - 4, sy); ctx.lineTo(gx + g.w + 4, sy); ctx.stroke(); ctx.restore(); }
                if (barre > .25) rotulo('92 °C', cx + cs / 2, cy - cs * .22 - 8, ROJO, 'center', 10);
                if (barre > .62) rotulo('81 °C', ux + uw * .5, uy - 7, AMBAR, 'center');
                const [f2x, f2y] = g.fans[1];
                if (barre > .5) rotulo('0 RPM', f2x - g.fr - 3, f2y, ROJO, 'right');
                const filas = [['CPU', '92 °C', ROJO, '▲'], ['FAN 2', '0 RPM', ROJO, '✕'], ['GPU', '81 °C', AMBAR, '!'], ['RAM 32 GB', 'MemTest', VERDE, L.ok], ['SSD SMART', '98 %', VERDE, L.ok], ['PSU 12 V', '12.08 V', VERDE, L.ok]];
                const y0 = zona.y + 18, paso = Math.min(24, (zona.h - 60) / filas.length);
                rotulo(L.diag, px, y0 - 6, 'rgba(148,163,184,.9)');
                filas.forEach(([n, v, col, s], k) => {
                    const q = entre(p, .14 + k * .085, .2 + k * .085);
                    if (!q) return;
                    const yy = y0 + 14 + k * paso;
                    ctx.globalAlpha = alfa * q;
                    rotulo(n, px, yy, 'rgba(226,232,240,.9)'); rotulo(v, px + pw * .5, yy, col, 'left');
                    rotulo(s, px + pw - 4, yy, col, 'right');
                    ctx.fillStyle = 'rgba(148,163,184,.12)'; ctx.fillRect(px, yy + paso / 2 - 1, pw - 4, 1);
                });
                ctx.globalAlpha = alfa;
                const fin = entre(p, .74, .82);
                if (fin) { ctx.globalAlpha = alfa * fin; caja2(px, zona.y + zona.h - 26, pw - 4, 20, 5, 'rgba(251,191,36,.12)', AMBAR); rotulo(L.fallas, px + (pw - 4) / 2, zona.y + zona.h - 16, AMBAR, 'center'); }
            } else if (e === 1) {
                // 2. LIMPIEZA: aire comprimido que se lleva el polvo, pasta térmica nueva y la temperatura que baja
                const { g, px, pw } = reparto(zona);
                const lev = entre(p, .52, .6) - entre(p, .74, .82), arriba = -g.h * .2 * sale(lev);
                const fanVive = p > .45;
                dibujaCaja(g); dibujaPlaca(g); dibujaCpu(g); dibujaSsd(g); dibujaRam(g, 0); dibujaRam(g, 1); dibujaPsu(g); dibujaGpu(g, 0, giro * 1.3);
                // pasta térmica: se esparce mientras el disipador está levantado
                const [[cx, cy], cs] = g.cpu, pasta = sale(entre(p, .6, .72));
                if (pasta) { ctx.fillStyle = 'rgba(226,232,240,.9)'; ctx.beginPath(); ctx.arc(cx + cs / 2, cy + cs / 2, cs * (.08 + .32 * pasta), 0, 7); ctx.fill(); }
                dibujaDisipador(g, 0, arriba, giro);
                dibujaFans(g, giro, fanVive ? -1 : 1);
                // polvo
                const qa = entre(p, .04, .5), [gx, gy] = g.A(0, 0);
                POLVO.forEach((m, i) => {
                    const pas = qa - m.q;
                    let x = gx + m.u * g.w, y = gy + m.v * g.h, a = .75;
                    if (pas > 0) { const s = pas * 14; x += s * g.w * .35 * (azarDe(i + 7) - .3); y -= s * g.h * .25 * azarDe(i + 11); a = Math.max(0, .75 - s * 1.2); }
                    if (a > 0) punto(x, y, m.r, `rgba(180,160,128,${a})`);
                });
                if (qa > 0 && qa < 1) {
                    const [u, v] = enRutaRel(qa), nx = gx + u * g.w, ny = gy + v * g.h;
                    ctx.strokeStyle = 'rgba(186,230,253,.5)'; ctx.lineWidth = 1;
                    for (let k = 0; k < 4; k++) { const q = (t * 3 + k / 4) % 1; ctx.beginPath(); ctx.arc(nx, ny, 4 + q * 16, Math.PI * .25, Math.PI * .75); ctx.stroke(); }
                    caja2(nx - 2.5, ny - 24, 5, 22, 2, '#e2e8f0', null); caja2(nx - 7, ny - 38, 14, 15, 3, ROJO, null);
                }
                if (fanVive) { const [fx, fy] = g.fans[1]; ctx.globalAlpha = alfa * entre(p, .45, .5); rotulo('1450 RPM', fx - g.fr - 3, fy, VERDE, 'right'); ctx.globalAlpha = alfa; }
                // gráfica de temperatura
                const gy0 = zona.y + 22, gh = zona.h * .55, x1 = px + pw - 6;
                rotulo(L.temp, px, zona.y + 8, 'rgba(148,163,184,.9)');
                ctx.strokeStyle = 'rgba(148,163,184,.15)'; ctx.lineWidth = 1;
                for (let k = 0; k <= 4; k++) { const yy = gy0 + gh * k / 4; ctx.beginPath(); ctx.moveTo(px, yy); ctx.lineTo(x1, yy); ctx.stroke(); }
                const temp = (q) => 92 - 38 * sale(entre(q, .3, .95)) + Math.sin(q * 40) * 1.2;
                const aY = (v) => gy0 + gh * (1 - (v - 40) / 60);
                const hasta = entre(p, .05, .9);
                ctx.lineWidth = 1.8; ctx.beginPath();
                for (let s = 0; s <= 60 * hasta; s++) { const q = s / 60, xx = px + (x1 - px) * q, yy = aY(temp(q)); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
                const grad = ctx.createLinearGradient(0, aY(95), 0, aY(50)); grad.addColorStop(0, ROJO); grad.addColorStop(.5, AMBAR); grad.addColorStop(1, VERDE);
                ctx.strokeStyle = grad; ctx.stroke();
                const ahora = Math.round(temp(hasta));
                rotulo(`${ahora} °C`, px + (x1 - px) * hasta, aY(temp(hasta)) - 10, ahora > 75 ? ROJO : ahora > 62 ? AMBAR : VERDE, hasta > .7 ? 'right' : 'left', 11);
                const yb = gy0 + gh + 18;
                rotulo(`${L.antes} 92 °C`, px, yb, ROJO); rotulo(`${L.despues} 54 °C`, x1, yb, VERDE, 'right');
                if (p > .82) { ctx.globalAlpha = alfa * entre(p, .82, .88); paloma(x1 - 4, yb + 22, 4); rotulo(L.limpio, x1 - 14, yb + 22, VERDE, 'right'); }
            } else if (e === 2) {
                // 3. ARMADO: cada pieza entra a su lugar, se tienden los cables y el equipo pasa el POST
                const { g, px, pw } = reparto(zona);
                dibujaCaja(g); dibujaPlaca(g, sale(entre(p, 0, .08)));
                const k = (i) => sale(entre(p, .06 + i * .1, .16 + i * .1));
                const fuera = (q, d) => (1 - q) * d;
                const vivo = p > .86 ? 1 : 0;
                const piezas = [
                    () => { const q = k(0); if (q) { ctx.globalAlpha = alfa * q; dibujaCpu(g, 0, fuera(q, -40)); } },
                    () => { const q = k(1); if (q) { ctx.globalAlpha = alfa * q; dibujaDisipador(g, 0, fuera(q, -60), giro * vivo); } },
                    () => { const q = k(2); if (q) { ctx.globalAlpha = alfa * q; dibujaRam(g, 0, fuera(q, -50)); ctx.globalAlpha = alfa * sale(entre(p, .3, .4)); dibujaRam(g, 1, fuera(sale(entre(p, .3, .4)), -50)); } },
                    () => { const q = k(3); if (q) { ctx.globalAlpha = alfa * q; dibujaGpu(g, fuera(q, g.w * .6), giro * 1.3 * vivo); } },
                    () => { const q = k(4); if (q) { ctx.globalAlpha = alfa * q; dibujaSsd(g, fuera(q, -30)); } },
                    () => { const q = k(5); if (q) { ctx.globalAlpha = alfa * q; dibujaPsu(g, fuera(q, 40)); } },
                ];
                // la SSD va debajo de la GPU
                [0, 1, 2, 4, 3, 5].forEach(i => piezas[i]());
                ctx.globalAlpha = alfa;
                const cab = entre(p, .68, .84);
                if (cab) {
                    const [[qx, qy], qw] = g.psu, [[cx, cy], cs] = g.cpu, [[ux, uy], uw] = g.gpu, [[bx, by], bw, bh] = g.placa;
                    const cables = [
                        [[qx + qw * .2, qy], [qx + qw * .2, by + bh + 5], [bx + bw + 5, by + bh + 5], [bx + bw + 5, cy + cs * .5], [bx + bw - 3, cy + cs * .5]],
                        [[qx + qw * .35, qy], [qx + qw * .35, uy + g.h * .12], [ux + uw * .85, uy + g.h * .12], [ux + uw * .85, uy + g.h * .085]],
                        [[qx + qw * .08, qy], [qx + qw * .08, by + bh * .12], [cx - 6, by + bh * .12], [cx - 6, cy - cs * .25]],
                    ];
                    cables.forEach((pts, i) => {
                        const q = entre(cab, i * .2, i * .2 + .6); if (!q) return;
                        const largos = pts.slice(1).map((pt, j) => Math.hypot(pt[0] - pts[j][0], pt[1] - pts[j][1])), total = largos.reduce((a, b) => a + b, 0);
                        let resta = total * q;
                        ctx.strokeStyle = i === 1 ? AMBAR : 'rgba(226,232,240,.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
                        for (let j = 1; j < pts.length && resta > 0; j++) { const f = Math.min(1, resta / largos[j - 1]); ctx.lineTo(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f); resta -= largos[j - 1]; }
                        ctx.stroke();
                    });
                }
                dibujaFans(g, giro * vivo);
                if (vivo) { const [gx, gy] = g.A(0, 0); ctx.strokeStyle = `rgba(110,162,255,${.35 + Math.sin(t * 4) * .2})`; ctx.lineWidth = 2; redondo(gx + 3, gy + 3, g.w - 6, g.h - 6, 6); ctx.stroke(); }
                // lista de piezas
                const y0 = zona.y + 12, paso = Math.min(22, (zona.h - 46) / L.piezas.length);
                L.piezas.forEach((n, i) => {
                    const listo = i < 6 ? k(i) >= 1 : cab >= 1, yy = y0 + i * paso;
                    ctx.strokeStyle = listo ? VERDE : 'rgba(148,163,184,.45)'; ctx.lineWidth = 1.2; ctx.strokeRect(px, yy - 5, 10, 10);
                    if (listo) paloma(px + 5, yy, 3.4);
                    rotulo(n, px + 18, yy, listo ? 'rgba(226,232,240,.95)' : 'rgba(148,163,184,.6)');
                });
                const fin = entre(p, .84, .88);
                if (fin) { ctx.globalAlpha = alfa * fin; caja2(px, zona.y + zona.h - 26, pw - 4, 20, 5, 'rgba(52,211,153,.12)', VERDE); rotulo(L.post, px + (pw - 4) / 2, zona.y + zona.h - 16, VERDE, 'center'); }
            } else if (e === 3) {
                // 4. FIRMWARE: chip con datos entrando por sus pines y tres actualizaciones en fila, verificadas al final
                caja2(zona.x, zona.y, zona.w, zona.h, 10, '#0a1430', 'rgba(110,162,255,.4)');
                ctx.save(); redondo(zona.x, zona.y, zona.w, zona.h, 10); ctx.clip(); ctx.fillStyle = 'rgba(110,162,255,.16)'; ctx.fillRect(zona.x, zona.y, zona.w, 20); ctx.restore();
                rotulo(L.fw, zona.x + 10, zona.y + 10, 'rgba(226,240,255,.95)');
                const cs = Math.min(zona.h * .34, zona.w * .18), cx = zona.x + zona.w * .17, cy = zona.y + 20 + (zona.h - 20) * .46;
                for (let k = 0; k < 6; k++) {
                    const off = (k - 2.5) * cs / 6.5;
                    [[cx - cs * 1.05, cy + off, cx - cs / 2, cy + off], [cx + off, cy - cs * 1.05, cx + off, cy - cs / 2], [cx + cs * 1.05, cy + off, cx + cs / 2, cy + off], [cx + off, cy + cs * 1.05, cx + off, cy + cs / 2]].forEach(([a, b, c2, d], j) => {
                        ctx.strokeStyle = 'rgba(110,162,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d); ctx.stroke();
                        if (p < .82) { const q = (t * 1.6 + k * .17 + j * .29) % 1; punto(a + (c2 - a) * q, b + (d - b) * q, 1.6, CIAN); }
                    });
                }
                caja2(cx - cs / 2, cy - cs / 2, cs, cs, 4, '#111a2e', p >= .82 ? VERDE : AZUL, 1.4);
                caja2(cx - cs * .3, cy - cs * .3, cs * .6, cs * .6, 2, null, 'rgba(110,162,255,.35)');
                punto(cx - cs * .36, cy - cs * .36, 1.8, AZUL);
                rotulo('UEFI', cx, cy - 5, 'rgba(226,240,255,.9)', 'center', 10);
                rotulo('SPI 32M', cx, cy + 8, 'rgba(148,163,184,.8)', 'center', 8);
                const items = [['BIOS / UEFI', '1.07', '2.14'], ['SSD NVMe', '3B2Q', '4B7Q'], ['BMC', '1.8.2', '2.3.0']];
                const lx = zona.x + zona.w * .37, lw = zona.x + zona.w - 12 - lx, y0 = zona.y + 38, paso = Math.min(50, (zona.h - 86) / 3);
                items.forEach(([n, a, b], i) => {
                    const q = entre(p, .08 + i * .24, .3 + i * .24), yy = y0 + i * paso;
                    rotulo(n, lx, yy, 'rgba(226,232,240,.95)');
                    rotulo(`${a} → ${b}`, lx + lw, yy, q >= 1 ? VERDE : 'rgba(148,163,184,.85)', 'right');
                    const segs = 20, bw = (lw - (segs - 1) * 2) / segs;
                    for (let s = 0; s < segs; s++) { ctx.fillStyle = s / segs < q ? (q >= 1 ? VERDE : AZUL) : 'rgba(148,163,184,.14)'; ctx.fillRect(lx + s * (bw + 2), yy + 9, bw, 6); }
                    if (q > 0 && q < 1) rotulo(`${Math.floor(q * 100)}%`, lx, yy + 24, CIAN, 'left', 8);
                    else if (q >= 1) { paloma(lx + 4, yy + 24, 3.2); rotulo('OK', lx + 12, yy + 24, VERDE, 'left', 8); }
                });
                const hy = zona.y + zona.h - 30;
                if (p < .82) {
                    let linea = '';
                    for (let k = 0; k < 10; k++) linea += Math.floor(azarDe(k + Math.floor(t * 12) * 13) * 256).toString(16).padStart(2, '0').toUpperCase() + ' ';
                    rotulo(`0x${(Math.floor(t * 4096) % 0xffffff).toString(16).padStart(6, '0').toUpperCase()}  ${linea}`, lx, hy, 'rgba(110,162,255,.6)', 'left', 8);
                    if (Math.sin(t * 6) > -.3) rotulo(`⚠ ${L.noApagar}`, lx, hy + 15, AMBAR, 'left', 8);
                } else {
                    ctx.globalAlpha = alfa * entre(p, .82, .88);
                    caja2(lx, hy - 4, lw, 20, 5, 'rgba(52,211,153,.12)', VERDE); rotulo(L.verif, lx + lw / 2, hy + 6, VERDE, 'center');
                }
            } else {
                // 5. ENTREGA: la PC en prueba de estrés, la impresora de fotos sacando una tira y el Pixel con GrapheneOS
                const col = zona.w / 3, base = zona.y + zona.h * .8;
                const aparece = (i) => sale(entre(p, .04 + i * .1, .2 + i * .1));
                let q = aparece(0);
                if (q) {
                    ctx.globalAlpha = alfa * q;
                    const mw = col * .88, mh = mw * .64, mx = zona.x + col * .06, my = base - mh - 16 + (1 - q) * 14;
                    caja2(mx + mw * .44, my + mh, mw * .12, 12, 0, '#334155', null); caja2(mx + mw * .3, my + mh + 11, mw * .4, 4, 2, '#475569', null);
                    caja2(mx, my, mw, mh, 5, '#0b1220', 'rgba(203,213,225,.6)', 1.3);
                    rotulo('CPU 100%', mx + 7, my + 10, 'rgba(148,163,184,.9)', 'left', 8);
                    rotulo('61 °C', mx + mw - 7, my + 10, VERDE, 'right', 8);
                    ctx.strokeStyle = VERDE; ctx.lineWidth = 1.4; ctx.beginPath();
                    const gx0 = mx + 6, gx1 = mx + mw - 6, gyy = my + mh * .66;
                    for (let s = 0; s <= 40; s++) { const xx = gx0 + (gx1 - gx0) * s / 40, yy = gyy - mh * .3 * (.78 + .14 * Math.sin(s * .9 + t * 3)); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
                    ctx.stroke();
                    if (p > .55) rotulo(L.estres, mx + mw / 2, my + mh - 9, VERDE, 'center', 8);
                }
                q = aparece(1);
                if (q) {
                    ctx.globalAlpha = alfa * q;
                    const iw = col * .76, ih = iw * .42, ix = zona.x + col + (col - iw) / 2, iy = base - ih + (1 - q) * 14;
                    const larga = Math.min(iw * 1.05, iy - zona.y - 6), sube = sale(entre(p, .3, .8)), th = larga * sube, tw = iw * .36, tx = ix + iw / 2 - tw / 2;
                    if (th > 1) {
                        ctx.save(); ctx.beginPath(); ctx.rect(tx - 2, iy - th, tw + 4, th + 2); ctx.clip();
                        const top = iy - larga;  // la tira completa, desplazada hacia arriba conforme sale
                        const off = larga - th;
                        caja2(tx, top + off, tw, larga, 2, '#f8fafc', null);
                        const marcos = ['#f472b6', '#60a5fa', '#fbbf24', '#34d399'], fh = (larga - 8) / 4;
                        marcos.forEach((m, k) => { const fy = top + off + 4 + k * fh, g2 = ctx.createLinearGradient(0, fy, 0, fy + fh); g2.addColorStop(0, m); g2.addColorStop(1, '#1e293b'); ctx.fillStyle = g2; ctx.fillRect(tx + 3, fy, tw - 6, fh - 3); });
                        ctx.restore();
                    }
                    caja2(ix, iy, iw, ih, 6, '#1f2937', 'rgba(203,213,225,.6)', 1.3);
                    caja2(ix + iw * .28, iy - 1, iw * .44, 4, 2, '#0b1220', null);
                    punto(ix + iw - 10, iy + ih - 9, 2.2, Math.sin(t * 5) > 0 ? VERDE : '#065f46');
                    rotulo('PHOTO', ix + 8, iy + ih - 9, 'rgba(203,213,225,.7)', 'left', 8);
                }
                q = aparece(2);
                if (q) {
                    ctx.globalAlpha = alfa * q;
                    const ph = Math.min(zona.h * .74, col * 1.3), pw2 = ph * .48, phx = zona.x + col * 2 + (col - pw2) / 2, phy = base - ph + (1 - q) * 14;
                    caja2(phx, phy, pw2, ph, pw2 * .16, '#0b1220', 'rgba(203,213,225,.7)', 1.4);
                    caja2(phx + pw2 * .1, phy + ph * .1, pw2 * .8, ph * .07, ph * .035, '#1e293b', null);
                    punto(phx + pw2 * .28, phy + ph * .135, ph * .018, '#475569'); punto(phx + pw2 * .44, phy + ph * .135, ph * .018, '#475569');
                    const ox = phx + pw2 / 2, oy = phy + ph * .5, rr = pw2 * .2, arranque = entre(p, .4, .75);
                    ctx.strokeStyle = 'rgba(148,163,184,.25)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(ox, oy, rr, 0, 7); ctx.stroke();
                    const a0 = -Math.PI / 2 + (arranque < 1 ? t * 4 : 0);
                    ctx.strokeStyle = arranque >= 1 ? VERDE : AZUL; ctx.beginPath(); ctx.arc(ox, oy, rr, a0, a0 + Math.PI * 2 * Math.max(.15, arranque)); ctx.stroke();
                    if (arranque >= 1) { caja2(ox - rr * .4, oy - rr * .05, rr * .8, rr * .6, 2, VERDE, null); ctx.strokeStyle = VERDE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(ox, oy - rr * .05, rr * .27, Math.PI, 0); ctx.stroke(); }
                    rotulo('GrapheneOS', ox, oy + rr + 14, 'rgba(226,232,240,.9)', 'center', 8);
                }
                const fin = entre(p, .7, .78);
                if (fin) { ctx.globalAlpha = alfa * fin; rotulo(L.listo, zona.x + zona.w / 2, zona.y + zona.h - 4, VERDE, 'center', 10); }
            }
            ctx.restore();
        };
        const estatico = !mueve();
        if (estatico) { reloj = INICIO[2] + DUR[2] * .9; const fijo = () => { antes = null; dibujar(0); }; fijo(); addEventListener('resize', fijo); }
        else bucle(caja, 60, dibujar);
        caja.closest('section')?.querySelectorAll('.service-list li[data-foco]').forEach(li => {
            li.addEventListener('pointerenter', () => { caja.dataset.foco = li.dataset.foco; if (estatico) dibujar(0); });
            li.addEventListener('pointerleave', () => { if (caja.dataset.foco === li.dataset.foco) delete caja.dataset.foco; if (estatico) { reloj = INICIO[2] + DUR[2] * .9; dibujar(0); } });
        });
    });

    // --- SOFTWARE A MEDIDA: cómo nace una plataforma. Requisitos, modelo de datos, interfaz, pruebas y despliegue.
    document.querySelectorAll('[data-medida-proceso]').forEach(caja => {
        const c = lienzo('proceso-lienzo');
        caja.prepend(c);
        const ctx = c.getContext('2d');
        const pasos = [...caja.querySelectorAll('.proceso-pasos li')];
        const ING = raiz.lang === 'en';
        const DUR = [4.6, 4.6, 5.2, 4.6, 5.2], INICIO = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
        const TOTAL = DUR.reduce((a, b) => a + b, 0);
        const sale = (x) => 1 - Math.pow(1 - limitar(x), 3);
        const suave = (x) => { x = limitar(x); return x * x * (3 - 2 * x); };
        const entre = (x, a, b) => limitar((x - a) / (b - a));
        const AZUL = '#6ea2ff', CIAN = '#22e1f0', VERDE = '#34d399', AMBAR = '#fbbf24', ROJO = '#f87171', ROSA = '#f472b6', VIOLETA = '#b39bff';
        const L = ING
            ? { cols: ['Checkout', 'Inventory', 'Reports'], notas: ['charge', 'receipt', 'cash-up', 'stock', 'alerts', 'purchases', 'daily sales', 'margin'], historias: '8 STORIES · 3 MODULES', migra: 'migration 0007 ✓', kpi: ['Sales', 'Tickets', 'Goal'], titulo: 'panel · Summary', menu: ['Summary', 'Checkout', 'Stock', 'Reports'],
                pruebas: ['closes the sale and updates stock', 'rejects a sale with no items', 'applies credit to the customer', 'syncs when the network returns', 'prints the receipt', 'cash-up matches the drawer'], resumen: (n, f) => `${n} tests · ${f} failed`, cobertura: 'coverage', prod: 'v1.4.0 IN PRODUCTION ✓', cola: (n) => `${n} queued`, sinRed: 'offline', sync: 'synced' }
            : { cols: ['Caja', 'Inventario', 'Reportes'], notas: ['cobrar', 'ticket', 'corte', 'stock', 'alertas', 'compras', 'ventas/día', 'margen'], historias: '8 HISTORIAS · 3 MÓDULOS', migra: 'migración 0007 ✓', kpi: ['Ventas', 'Tickets', 'Meta'], titulo: 'panel · Resumen', menu: ['Resumen', 'Caja', 'Stock', 'Reportes'],
                pruebas: ['cierra la venta y descuenta stock', 'rechaza una venta sin artículos', 'aplica el crédito al cliente', 'sincroniza al volver la red', 'imprime el ticket', 'el corte cuadra con la caja'], resumen: (n, f) => `${n} pruebas · ${f} fallas`, cobertura: 'cobertura', prod: 'v1.4.0 EN PRODUCCIÓN ✓', cola: (n) => `${n} en cola`, sinRed: 'sin red', sync: 'sincronizado' };
        let W = 0, H = 0, dpr = 1, reloj = 0, antes = null, etapaVista = -1;

        const medir = () => {
            dpr = Math.min(devicePixelRatio || 1, 2);
            const w = caja.clientWidth, h = caja.clientHeight;
            if (w !== W || h !== H) { W = w; H = h; c.width = w * dpr; c.height = h * dpr; }
        };
        const redondo = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
        const punto = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
        const rotulo = (txt, x, y, col = 'rgba(148,163,184,.8)', alin = 'left', tam = 9, peso = 500) => {
            ctx.fillStyle = col; ctx.font = `${peso} ${tam}px ui-monospace, Menlo, monospace`; ctx.textAlign = alin; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
        };
        const caja2 = (x, y, w, h, r, relleno, borde, ancho = 1, guion = null) => { redondo(x, y, w, h, r); if (relleno) { ctx.fillStyle = relleno; ctx.fill(); } if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = ancho; ctx.setLineDash(guion || []); ctx.stroke(); ctx.setLineDash([]); } };
        const paloma = (x, y, s, col = VERDE) => { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * .3, y + s * .7); ctx.lineTo(x + s, y - s * .7); ctx.stroke(); };
        const medidas = (pts) => { const l = []; let total = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); l.push(d); total += d; } return [l, total]; };
        const tramo = (pts, q, col, ancho = 1.2) => {
            const [largos, total] = medidas(pts);
            let resta = total * limitar(q);
            if (resta <= 0) return;
            ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length && resta > 0; i++) { const f = Math.min(1, resta / (largos[i - 1] || 1)); ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); resta -= largos[i - 1]; }
            ctx.stroke();
        };
        const enRuta = (pts, q) => {
            const [largos, total] = medidas(pts);
            let d = total * limitar(q);
            for (let i = 1; i < pts.length; i++) { if (d <= largos[i - 1]) { const f = d / (largos[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; } d -= largos[i - 1]; }
            return pts[pts.length - 1];
        };
        const cursor = (x, y, clic = 0) => {
            if (clic) { ctx.strokeStyle = `rgba(110,162,255,${1 - clic})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, 4 + clic * 12, 0, 7); ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 13); ctx.lineTo(x + 3.5, y + 9.5); ctx.lineTo(x + 8.5, y + 9.5); ctx.closePath();
            ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 1; ctx.stroke();
        };
        // Modelo de datos: tablas con sus campos (nombre, tipo de llave) y columna en la que van
        const TABLAS = [
            { n: 'customers', col: 0, v: .06, campos: [['id', 'PK'], ['name'], ['credit']] },
            { n: 'sales', col: 1, v: .04, campos: [['id', 'PK'], ['customer_id', 'FK'], ['total'], ['closed_at']] },
            { n: 'sale_items', col: 1, v: .56, campos: [['sale_id', 'FK'], ['product_id', 'FK'], ['qty']] },
            { n: 'products', col: 2, v: .5, campos: [['id', 'PK'], ['name'], ['price'], ['stock']] },
        ];
        const NOTAS = L.notas.map((n, i) => ({ n, col: i < 3 ? 0 : i < 6 ? 1 : 2, fila: i < 3 ? i : i < 6 ? i - 3 : i - 6, u: azarDe(i + 3), v: azarDe(i + 50), r: (azarDe(i + 90) - .5) * .5, color: [AMBAR, ROSA, CIAN, VERDE][i % 4] }));

        const dibujar = (tAbs) => {
            medir();
            if (!W || !H) return;
            const dt = antes === null ? 0 : Math.min(tAbs - antes, .1);
            antes = tAbs;
            reloj = (reloj + dt) % TOTAL;
            let e = 0; while (e < 4 && reloj >= INICIO[e + 1]) e++;
            const p = (reloj - INICIO[e]) / DUR[e];
            if (e !== etapaVista) { etapaVista = e; pasos.forEach((li, k) => li.classList.toggle('activo', k === e)); }
            const alfa = Math.min(sale(entre(p, 0, .1)), 1 - entre(p, .92, 1));
            const t = tAbs;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.save(); ctx.globalAlpha = alfa;
            const zona = { x: W * .04, y: H * .03, w: W * .92, h: H * .84 };

            if (e === 0) {
                // 1. REQUISITOS: notas de la entrevista que se acomodan en módulos
                caja2(zona.x, zona.y, zona.w, zona.h, 10, '#0d1526', 'rgba(148,163,184,.3)');
                ctx.fillStyle = 'rgba(148,163,184,.12)';
                for (let x = zona.x + 10; x < zona.x + zona.w; x += 14) for (let y = zona.y + 10; y < zona.y + zona.h; y += 14) ctx.fillRect(x, y, 1, 1);
                const cw = zona.w / 3, nw = Math.min(cw * .76, 96), nh = Math.min((zona.h - 74) / 3.3, 42);
                const orden = entre(p, .25, .75);
                L.cols.forEach((n, k) => {
                    const q = entre(p, .12 + k * .05, .25 + k * .05);
                    ctx.globalAlpha = alfa * q;
                    rotulo(n.toUpperCase(), zona.x + cw * (k + .5), zona.y + 16, 'rgba(226,232,240,.9)', 'center', 9, 700);
                    ctx.fillStyle = 'rgba(110,162,255,.5)'; ctx.fillRect(zona.x + cw * k + 12, zona.y + 26, cw - 24, 1);
                });
                ctx.globalAlpha = alfa;
                const arrastra = 4;  // la nota que se lleva con el cursor
                NOTAS.forEach((m, i) => {
                    const q = suave(entre(orden, i * .06, i * .06 + .5)), ap = sale(entre(p, .02 + i * .025, .12 + i * .025));
                    if (!ap) return;
                    const x0 = zona.x + 10 + m.u * (zona.w - nw - 20), y0 = zona.y + 34 + m.v * (zona.h - nh - 44);
                    const x1 = zona.x + cw * (m.col + .5) - nw / 2, y1 = zona.y + 36 + m.fila * (nh + 8);
                    const x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q, r = m.r * (1 - q);
                    ctx.save(); ctx.globalAlpha = alfa * ap; ctx.translate(x + nw / 2, y + nh / 2); ctx.rotate(r);
                    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
                    caja2(-nw / 2, -nh / 2, nw, nh, 3, m.color, null);
                    ctx.shadowColor = 'transparent';
                    rotulo(m.n, -nw / 2 + 6, -nh / 2 + 10, '#0b1220', 'left', 9, 700);
                    ctx.fillStyle = 'rgba(11,18,32,.35)'; ctx.fillRect(-nw / 2 + 6, nh / 2 - 12, nw * .5, 2); ctx.fillRect(-nw / 2 + 6, nh / 2 - 7, nw * .32, 2);
                    ctx.restore();
                    if (i === arrastra && q > 0 && q < 1) cursor(x + nw * .7, y + nh * .6);
                });
                const fin = entre(p, .8, .86);
                if (fin) { ctx.globalAlpha = alfa * fin; caja2(zona.x + zona.w / 2 - 80, zona.y + zona.h - 24, 160, 18, 9, 'rgba(15,23,42,.9)', AZUL); rotulo(L.historias, zona.x + zona.w / 2, zona.y + zona.h - 15, AZUL, 'center', 9, 700); }
            } else if (e === 1) {
                // 2. DATOS: el modelo relacional se arma campo por campo y se unen las llaves
                caja2(zona.x - 6, zona.y - 4, zona.w + 12, zona.h + 8, 10, 'rgba(10,15,28,.82)', 'rgba(148,163,184,.18)');
                const tw = Math.min(zona.w * .3, 128), fh = Math.min(15, zona.h * .055), hh = fh + 4, chico = tw < 112 ? 7.5 : 9;
                const colX = [zona.x, zona.x + (zona.w - tw) / 2, zona.x + zona.w - tw];
                const pos = TABLAS.map(tb => ({ x: colX[tb.col], y: zona.y + tb.v * zona.h }));
                const fila = (i, k) => [pos[i].x, pos[i].y + hh + fh * (k + .5) + 2];
                // relaciones primero, debajo de las tablas: [tabla, campo] → [tabla, campo]
                const rel = [[0, 0, 1, 1], [1, 0, 2, 0], [3, 0, 2, 1]];
                rel.forEach(([a, ka, b, kb], j) => {
                    const q = entre(p, .55 + j * .1, .72 + j * .1); if (!q) return;
                    const [ax, ay] = fila(a, ka), [bx, by] = fila(b, kb);
                    let pts;
                    if (a === 0) pts = [[ax + tw, ay], [(ax + tw + bx) / 2, ay], [(ax + tw + bx) / 2, by], [bx, by]];
                    else if (a === 1) pts = [[ax, ay], [ax - 12, ay], [bx - 12, by], [bx, by]];
                    else pts = [[ax, ay], [ax - 14, ay], [ax - 14, by], [bx + tw, by]];
                    tramo(pts, q, AMBAR, 1.3);
                    if (q >= 1) { const [ex, ey] = pts[pts.length - 1], d = pts[pts.length - 2][0] < ex ? -1 : 1; ctx.strokeStyle = AMBAR; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(ex + d * 7, ey); ctx.lineTo(ex, ey - 4); ctx.moveTo(ex + d * 7, ey); ctx.lineTo(ex, ey + 4); ctx.stroke(); }
                });
                TABLAS.forEach((tb, i) => {
                    const q = sale(entre(p, .04 + i * .1, .16 + i * .1)); if (!q) return;
                    const x = pos[i].x, y = pos[i].y + (1 - q) * 10, alto = hh + fh * tb.campos.length + 4;
                    ctx.globalAlpha = alfa * q;
                    caja2(x, y, tw, alto, 5, '#0f1a30', 'rgba(110,162,255,.55)');
                    ctx.save(); redondo(x, y, tw, alto, 5); ctx.clip(); ctx.fillStyle = 'rgba(110,162,255,.22)'; ctx.fillRect(x, y, tw, hh); ctx.restore();
                    rotulo(tb.n, x + 7, y + hh / 2, 'rgba(226,240,255,.95)', 'left', 9, 700);
                    tb.campos.forEach(([n, k], j) => {
                        const qq = entre(p, .1 + i * .1 + j * .04, .16 + i * .1 + j * .04); if (!qq) return;
                        ctx.globalAlpha = alfa * qq * q;
                        const yy = y + hh + fh * (j + .5) + 2;
                        rotulo(n, x + 6, yy, k === 'PK' ? '#f8fafc' : 'rgba(203,213,225,.85)', 'left', chico);
                        if (k) rotulo(k, x + tw - 5, yy, k === 'PK' ? CIAN : AMBAR, 'right', chico - 1, 700);
                    });
                });
                ctx.globalAlpha = alfa;
                const fin = entre(p, .86, .9);
                if (fin) { ctx.globalAlpha = alfa * fin; const fx = colX[2], fy = zona.y + zona.h * .14; paloma(fx + 5, fy, 4); rotulo(L.migra, fx + 14, fy, VERDE); rotulo('PostgreSQL · SQLite', fx, fy + 16, 'rgba(148,163,184,.8)', 'left', 8); }
            } else if (e === 2) {
                // 3. INTERFAZ: un boceto en gris que se convierte en el panel real, y su versión de teléfono
                const movil = entre(p, .72, .86);
                const aw = zona.w * (1 - .26 * sale(movil)), ah = zona.h, ax = zona.x, ay = zona.y;
                caja2(ax, ay, aw, ah, 8, '#0b1220', 'rgba(148,163,184,.5)', 1.2);
                [ROJO, AMBAR, VERDE].forEach((cc, k) => punto(ax + 10 + k * 8, ay + 9, 2.4, cc));
                rotulo(L.titulo, ax + aw / 2, ay + 9, 'rgba(148,163,184,.85)', 'center', 8);
                ctx.fillStyle = 'rgba(148,163,184,.2)'; ctx.fillRect(ax, ay + 18, aw, 1);
                const real = entre(p, .3, .58);              // barrido de boceto a diseño
                const barX = ax + aw * real;
                const crece = sale(entre(p, .5, .7));
                const piezas = (modo) => {
                    const sb = aw * .22, cx = ax + sb + 10, cw2 = aw - sb - 20, top = ay + 26;
                    if (modo) { ctx.fillStyle = '#0f1a30'; ctx.fillRect(ax + 1, ay + 19, sb, ah - 20); }
                    L.menu.forEach((n, k) => {
                        const yy = top + 8 + k * 18;
                        if (modo) { if (k === (p > .7 ? 1 : 0)) caja2(ax + 6, yy - 7, sb - 12, 14, 4, 'rgba(110,162,255,.22)', null); rotulo(n, ax + 12, yy, 'rgba(203,213,225,.9)', 'left', 8); }
                        else { ctx.fillStyle = 'rgba(148,163,184,.3)'; ctx.fillRect(ax + 10, yy - 2, sb * .6, 4); }
                    });
                    const kw = (cw2 - 12) / 3, kh = Math.min(42, ah * .2);
                    const val = [`$${Math.round(48320 * crece).toLocaleString('en-US')}`, `${Math.round(312 * crece)}`, `${Math.round(94 * crece)}%`];
                    for (let k = 0; k < 3; k++) {
                        const kx = cx + k * (kw + 6);
                        if (modo) { caja2(kx, top, kw, kh, 5, '#111c33', 'rgba(110,162,255,.3)'); rotulo(L.kpi[k], kx + 7, top + 10, 'rgba(148,163,184,.85)', 'left', 8); rotulo(val[k], kx + 7, top + kh - 13, [AZUL, VIOLETA, VERDE][k], 'left', Math.min(13, kw / 6.5), 700); }
                        else { caja2(kx, top, kw, kh, 3, null, 'rgba(148,163,184,.45)', 1, [3, 3]); ctx.strokeStyle = 'rgba(148,163,184,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(kx, top); ctx.lineTo(kx + kw, top + kh); ctx.moveTo(kx + kw, top); ctx.lineTo(kx, top + kh); ctx.stroke(); }
                    }
                    const gy = top + kh + 10, gh = ah - (gy - ay) - 12, gw = cw2 * .62;
                    if (modo) caja2(cx, gy, gw, gh, 5, '#111c33', 'rgba(110,162,255,.3)'); else caja2(cx, gy, gw, gh, 3, null, 'rgba(148,163,184,.45)', 1, [3, 3]);
                    const nb = 9, bw = (gw - 20) / nb;
                    for (let k = 0; k < nb; k++) {
                        const alto = (gh - 26) * (.3 + azarDe(k + 11) * .65);
                        const bx = cx + 10 + k * bw, by = gy + gh - 8;
                        if (modo) { const sube = sale(entre(p, .45 + k * .02, .62 + k * .02)), g2 = ctx.createLinearGradient(0, by - alto, 0, by); g2.addColorStop(0, CIAN); g2.addColorStop(1, AZUL); ctx.fillStyle = g2; ctx.fillRect(bx + 2, by - alto * sube, bw - 4, alto * sube); }
                        else { ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 2, by - alto, bw - 4, alto); }
                    }
                    const lx = cx + gw + 8, lw = cw2 - gw - 8;
                    if (modo) caja2(lx, gy, lw, gh, 5, '#111c33', 'rgba(110,162,255,.3)'); else caja2(lx, gy, lw, gh, 3, null, 'rgba(148,163,184,.45)', 1, [3, 3]);
                    for (let k = 0; k < 5; k++) {
                        const yy = gy + 12 + k * Math.min(18, (gh - 16) / 5);
                        if (modo) { punto(lx + 9, yy, 3, [AZUL, VERDE, AMBAR, ROSA, CIAN][k]); ctx.fillStyle = 'rgba(226,232,240,.6)'; ctx.fillRect(lx + 16, yy - 2, lw * .45, 3); ctx.fillStyle = 'rgba(148,163,184,.4)'; ctx.fillRect(lx + lw - 20, yy - 2, 12, 3); }
                        else { ctx.fillStyle = 'rgba(148,163,184,.3)'; ctx.fillRect(lx + 8, yy - 2, lw - 16, 4); }
                    }
                };
                ctx.save(); ctx.beginPath(); ctx.rect(barX, ay + 19, aw, ah); ctx.clip(); piezas(false); ctx.restore();
                if (real > 0) { ctx.save(); ctx.beginPath(); ctx.rect(ax, ay + 19, barX - ax, ah); ctx.clip(); piezas(true); ctx.restore(); }
                if (real > 0 && real < 1) { ctx.save(); ctx.strokeStyle = VIOLETA; ctx.lineWidth = 1.5; ctx.shadowColor = VIOLETA; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(barX, ay + 19); ctx.lineTo(barX, ay + ah); ctx.stroke(); ctx.restore(); }
                // cursor que recorre y hace clic en el segundo elemento del menú
                if (p > .58 && p < .9) {
                    const ruta = [[ax + aw * .6, ay + ah * .7], [ax + aw * .12, ay + 26 + 8 + 18]], q = suave(entre(p, .6, .7));
                    const [mx, my] = enRuta(ruta, q);
                    cursor(mx, my, q >= 1 ? entre(p, .7, .78) : 0);
                }
                if (movil) {
                    ctx.globalAlpha = alfa * movil;
                    const ph = zona.h * .94, pw = Math.min(ph * .48, zona.w * .24), px = zona.x + zona.w - pw + (1 - sale(movil)) * 30, py = zona.y + (zona.h - ph) / 2;
                    caja2(px, py, pw, ph, 12, '#0b1220', 'rgba(203,213,225,.7)', 1.3);
                    const ix = px + 7, iw = pw - 14;
                    for (let k = 0; k < 3; k++) { const ky = py + 18 + k * 26; caja2(ix, ky, iw, 22, 4, '#111c33', 'rgba(110,162,255,.3)'); rotulo(L.kpi[k], ix + 5, ky + 7, 'rgba(148,163,184,.85)', 'left', 7); ctx.fillStyle = [AZUL, VIOLETA, VERDE][k]; ctx.fillRect(ix + 5, ky + 13, iw * (.35 + k * .12), 4); }
                    const gy = py + 18 + 3 * 26, gh = ph - (gy - py) - 14;
                    caja2(ix, gy, iw, gh, 4, '#111c33', 'rgba(110,162,255,.3)');
                    const bw = (iw - 8) / 6;
                    for (let k = 0; k < 6; k++) { const alto = (gh - 12) * (.3 + azarDe(k + 11) * .65); ctx.fillStyle = AZUL; ctx.fillRect(ix + 4 + k * bw + 1.5, gy + gh - 5 - alto, bw - 3, alto); }
                }
            } else if (e === 3) {
                // 4. PRUEBAS: la suite corre, una prueba falla, se corrige y todo pasa
                const tw2 = zona.w * .68;
                caja2(zona.x, zona.y, tw2, zona.h, 8, '#0a0f1c', 'rgba(148,163,184,.4)');
                [ROJO, AMBAR, VERDE].forEach((cc, k) => punto(zona.x + 10 + k * 8, zona.y + 9, 2.4, cc));
                ctx.fillStyle = 'rgba(148,163,184,.2)'; ctx.fillRect(zona.x, zona.y + 18, tw2, 1);
                const segunda = p > .5;                      // segunda corrida tras la corrección
                const base = segunda ? .56 : .04;
                const verLista = !(p > .4 && p < .56);
                rotulo(segunda ? '$ npm test' : '$ npm test', zona.x + 9, zona.y + 30, 'rgba(203,213,225,.9)');
                const paso = Math.min(17, (zona.h - 70) / L.pruebas.length);
                if (verLista) L.pruebas.forEach((n, k) => {
                    const q = entre(p, base + k * .045, base + k * .045 + .04); if (!q) return;
                    const falla = !segunda && k === 3;
                    const yy = zona.y + 46 + k * paso;
                    ctx.globalAlpha = alfa * q;
                    rotulo(falla ? '✕' : '✓', zona.x + 10, yy, falla ? ROJO : VERDE, 'left', 9, 700);
                    rotulo(n, zona.x + 22, yy, falla ? ROJO : 'rgba(203,213,225,.88)', 'left', 8);
                    if (tw2 > 250) rotulo(`${Math.round(4 + azarDe(k + (segunda ? 9 : 0)) * 30)}ms`, zona.x + tw2 - 8, yy, 'rgba(100,116,139,.9)', 'right', 8);
                });
                ctx.globalAlpha = alfa;
                const ry = zona.y + zona.h - 18;
                if (!segunda && p > .34 && p < .4) { caja2(zona.x + 8, ry - 9, tw2 - 16, 18, 4, 'rgba(248,113,113,.12)', ROJO); rotulo(L.resumen(48, 1), zona.x + 16, ry, ROJO, 'left', 8, 700); }
                if (segunda && p > .84) { caja2(zona.x + 8, ry - 9, tw2 - 16, 18, 4, 'rgba(52,211,153,.12)', VERDE); rotulo(L.resumen(48, 0), zona.x + 16, ry, VERDE, 'left', 8, 700); }
                // la corrección: un diff entre corridas
                if (!verLista) {
                    ctx.globalAlpha = alfa * Math.min(entre(p, .4, .43), 1 - entre(p, .53, .56));
                    const dx = zona.x + 10, dy = zona.y + zona.h * .34, dw = tw2 - 20;
                    rotulo('sync.ts', dx, dy - 10, 'rgba(148,163,184,.85)', 'left', 8);
                    caja2(dx, dy, dw, 44, 5, '#111827', 'rgba(148,163,184,.5)');
                    ctx.fillStyle = 'rgba(248,113,113,.12)'; ctx.fillRect(dx + 1, dy + 5, dw - 2, 15); ctx.fillStyle = 'rgba(52,211,153,.12)'; ctx.fillRect(dx + 1, dy + 24, dw - 2, 15);
                    rotulo('- if (online) sync()', dx + 8, dy + 12, ROJO, 'left', 8);
                    rotulo('+ queue.flush().then(sync)', dx + 8, dy + 31, VERDE, 'left', 8);
                    ctx.globalAlpha = alfa;
                }
                // anillo de cobertura
                const rx = zona.x + tw2 + (zona.w - tw2) / 2, rcy = zona.y + zona.h * .42, rr = Math.min((zona.w - tw2) * .34, zona.h * .26);
                const cob = segunda ? .81 + .13 * sale(entre(p, .58, .86)) : .81 * sale(entre(p, .05, .36));
                ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(148,163,184,.15)'; ctx.beginPath(); ctx.arc(rx, rcy, rr, 0, 7); ctx.stroke();
                ctx.strokeStyle = cob > .9 ? VERDE : AMBAR; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(rx, rcy, rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(.001, cob)); ctx.stroke(); ctx.lineCap = 'butt';
                rotulo(`${Math.round(cob * 100)}%`, rx, rcy, '#f1f5f9', 'center', Math.min(14, rr * .55), 700);
                rotulo(L.cobertura, rx, rcy + rr + 14, 'rgba(148,163,184,.85)', 'center', 8);
            } else {
                // 5. DESPLIEGUE: el pipeline publica y los equipos sincronizan, incluso el que se quedó sin red
                caja2(zona.x - 6, zona.y - 4, zona.w + 12, zona.h + 8, 10, 'rgba(10,15,28,.82)', 'rgba(148,163,184,.18)');
                const etapas = ['build', 'test', 'deploy', 'prod'], ny = zona.y + 14, nx0 = zona.x + 20, nx1 = zona.x + zona.w - 20;
                const nodoX = (k) => nx0 + (nx1 - nx0) * k / 3;
                etapas.forEach((n, k) => {
                    const x = nodoX(k), q = entre(p, .04 + k * .09, .1 + k * .09);
                    if (k) { ctx.strokeStyle = 'rgba(148,163,184,.3)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(nodoX(k - 1) + 9, ny); ctx.lineTo(x - 9, ny); ctx.stroke(); tramo([[nodoX(k - 1) + 9, ny], [x - 9, ny]], entre(p, k * .09 - .02, .04 + k * .09), VERDE, 1.6); }
                    punto(x, ny, 8, q >= 1 ? 'rgba(52,211,153,.18)' : '#111827');
                    ctx.strokeStyle = q >= 1 ? VERDE : q > 0 ? AZUL : 'rgba(148,163,184,.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, ny, 8, 0, 7); ctx.stroke();
                    if (q > 0 && q < 1) { ctx.strokeStyle = AZUL; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, ny, 8, t * 6, t * 6 + 1.6); ctx.stroke(); }
                    if (q >= 1) paloma(x, ny, 3.4);
                    rotulo(n, x, ny + 17, 'rgba(203,213,225,.85)', 'center', 8);
                });
                const sx = zona.x + zona.w / 2, sy = zona.y + zona.h * .56, sw = 46, sh = 34;
                const vivo = entre(p, .38, .44);
                const eq = [
                    { x: zona.x + zona.w * .13, y: sy, tipo: 'laptop' },
                    { x: zona.x + zona.w * .87, y: sy, tipo: 'tablet' },
                    { x: sx, y: zona.y + zona.h - 22, tipo: 'tel' },
                ];
                const cortado = (k) => k === 1 && p > .5 && p < .72;
                eq.forEach((d, k) => {
                    const q = sale(entre(p, .4 + k * .04, .5 + k * .04)); if (!q) return;
                    ctx.globalAlpha = alfa * q;
                    ctx.strokeStyle = cortado(k) ? 'rgba(248,113,113,.5)' : 'rgba(110,162,255,.35)'; ctx.setLineDash(cortado(k) ? [3, 4] : []); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(sx, sy); ctx.stroke(); ctx.setLineDash([]);
                    if (!cortado(k) && vivo >= 1) for (let j = 0; j < 2; j++) { const f = (t * .9 + j * .5 + k * .3) % 1, ida = j ? f : 1 - f; punto(d.x + (sx - d.x) * ida, d.y + (sy - d.y) * ida, 2, j ? CIAN : VIOLETA); }
                });
                ctx.globalAlpha = alfa * Math.max(.35, vivo);
                caja2(sx - sw / 2, sy - sh / 2, sw, sh, 4, '#111a2e', vivo >= 1 ? VERDE : 'rgba(148,163,184,.5)', 1.3);
                for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgba(148,163,184,.25)'; ctx.fillRect(sx - sw / 2 + 6, sy - sh / 2 + 6 + k * 9, sw - 20, 4); punto(sx + sw / 2 - 8, sy - sh / 2 + 8 + k * 9, 1.6, vivo >= 1 && azarDe(k + Math.floor(t * 6)) > .3 ? VERDE : '#334155'); }
                eq.forEach((d, k) => {
                    const q = sale(entre(p, .4 + k * .04, .5 + k * .04)); if (!q) return;
                    ctx.globalAlpha = alfa * q;
                    if (d.tipo === 'laptop') { caja2(d.x - 20, d.y - 15, 40, 26, 3, '#0b1220', 'rgba(203,213,225,.7)', 1.2); caja2(d.x - 25, d.y + 11, 50, 4, 2, '#334155', null); }
                    else if (d.tipo === 'tablet') caja2(d.x - 15, d.y - 20, 30, 40, 4, '#0b1220', cortado(k) ? ROJO : 'rgba(203,213,225,.7)', 1.2);
                    else caja2(d.x - 8, d.y - 14, 16, 28, 3, '#0b1220', 'rgba(203,213,225,.7)', 1.2);
                    if (k === 1) {
                        if (cortado(k)) { const n = 1 + Math.floor(entre(p, .52, .7) * 2.99); rotulo(L.sinRed, d.x, d.y - 29, ROJO, 'center', 8, 700); rotulo(L.cola(n), d.x, d.y + 30, AMBAR, 'center', 8); }
                        else if (p >= .72) rotulo(L.sync, d.x, d.y + 30, VERDE, 'center', 8);
                    }
                });
                const fin = entre(p, .8, .86);
                if (fin) { ctx.globalAlpha = alfa * fin; rotulo(L.prod, sx, sy - sh / 2 - 12, VERDE, 'center', 9, 700); }
            }
            ctx.restore();
        };
        if (!mueve()) { reloj = INICIO[2] + DUR[2] * .66; const fijo = () => { antes = null; dibujar(0); }; fijo(); addEventListener('resize', fijo); }
        else bucle(caja, 60, dibujar);
    });

    document.querySelectorAll('[data-ascii-anim]').forEach(caja => {
        const escena = ESCENAS[caja.dataset.asciiAnim];
        if (!escena || ligero()) return caja.remove();
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
            escena(v, col, fil, t, { n: caja.dataset.foco || '', k: Math.min(1, Math.max(0, (t - desde) / .35)), dt: t - desde });
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
