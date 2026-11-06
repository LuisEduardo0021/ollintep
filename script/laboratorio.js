/* Laboratorio visual de Ollin-Tep: shaders WebGL, enjambre de partículas, moiré y tinta.
   Cada experimento solo se dibuja mientras está en pantalla; la resolución se adapta al equipo. */
(() => {
    const EN = document.documentElement.lang === 'en';
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tactil = matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    // --- Idioma ---
    const idioma = document.querySelector('[data-idioma]');
    if (idioma) {
        idioma.textContent = EN ? 'ES' : 'EN';
        idioma.href = EN ? location.pathname.replace(/^\/en(?=\/)/, '') : '/en' + location.pathname;
        idioma.addEventListener('click', () => { try { localStorage.setItem('ollintep-idioma', EN ? 'es' : 'en'); } catch (e) {} });
    }

    // --- Desplazamiento: velocidad suavizada (el túnel acelera con ella) ---
    let ultimoY = scrollY, velScroll = 0;
    addEventListener('scroll', () => { velScroll += Math.abs(scrollY - ultimoY); ultimoY = scrollY; }, { passive: true });

    // --- Puntero por sección (coordenadas 0..1, y hacia arriba como en GL) ---
    const escenas = [];
    const crearPuntero = (el) => {
        const p = { x: .5, y: .5, sx: .5, sy: .5, pulso: 0, dentro: false };
        const mover = (e) => {
            const r = el.getBoundingClientRect();
            p.x = (e.clientX - r.left) / r.width;
            p.y = 1 - (e.clientY - r.top) / r.height;
            p.dentro = true;
        };
        el.addEventListener('pointermove', mover, { passive: true });
        el.addEventListener('pointerdown', (e) => { mover(e); p.pulso = 1; }, { passive: true });
        el.addEventListener('pointerleave', () => { p.dentro = false; });
        return p;
    };

    // ================= SHADERS =================
    const CABECERA = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 R; uniform float T; uniform vec2 M; uniform float P;
float hh(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ruido(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hh(i),hh(i+vec2(1,0)),u.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),u.x),u.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
`;
    const SHADERS = {
        // 01: deformación de dominio con brillo de obsidiana; la luz y el remolino siguen al cursor
        obsidiana: `
float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*ruido(p);p=r*p*2.03+1.7;a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  vec2 m=(M-.5)*vec2(R.x/R.y,1.);
  vec2 d=uv-m; float w=exp(-3.*dot(d,d));
  vec2 p=(m+rot(w*(1.6+P*2.))*d)*1.7;
  float t=T*.07;
  vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(p+3.6*q+vec2(1.7,9.2)+t*1.4),fbm(p+3.6*q+vec2(8.3,2.8)-t*1.1));
  float f=fbm(p+3.8*r);
  vec3 c=mix(vec3(.015,.02,.06),vec3(.10,.16,.52),clamp(f*f*3.2,0.,1.));
  c=mix(c,vec3(.70,.38,1.),clamp(dot(q,q)*.9-.2,0.,1.)*.85);
  c=mix(c,vec3(1.,.42,.14),clamp(r.x*r.x*1.9-.35,0.,1.)*.9);
  c=mix(c,vec3(.35,.8,1.),smoothstep(.62,.95,r.y)*.55);
  c*=f*1.7+.12;
  c+=vec3(1.,.9,.85)*pow(smoothstep(.5,.9,f),3.)*.45;
  c*=1.+.45*exp(-2.2*dot(d,d));
  c+=P*.25*exp(-abs(length(d)-(1.-P)*1.2)*14.)*vec3(.6,.7,1.);
  c*=1.-.45*dot(uv*.9,uv*.9);
  gl_FragColor=vec4(pow(clamp(c,0.,1.),vec3(.92)),1.);
}`,
        // 02: túnel polar con grecas y pulsos de neón
        tunel: `
vec3 neon(float t){return .55+.45*cos(6.28318*(t+vec3(.0,.62,.38)));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  uv-= (M-.5)*.35;
  float r=length(uv), a=atan(uv.y,uv.x);
  float z=.32/max(r,.001)+T;
  a+=.35*sin(z*.35)+T*.04;
  vec2 st=vec2(a/6.28318*14.,z*1.6);
  vec2 id=floor(st), g=fract(st)-.5;
  float k=hh(vec2(mod(id.x,14.),id.y));
  float d=max(abs(g.x),abs(g.y));
  float q=abs(fract(d*3.+.5)-.5);
  float esc=abs(fract((g.x*sign(k-.5)+g.y)*2.+.25)-.5);
  float lin=mix(q,min(q,esc+step(d,.17)),step(.55,k));
  float aa=fwidth(lin)*1.5+1e-4;
  float trazo=smoothstep(.07+aa,.07-aa,lin);
  float halo=exp(-lin*9.)*.35;
  float pulso=pow(.5+.5*sin(id.y*.45-T*5.),6.);
  vec3 col=neon(id.y*.035+k*.15+T*.02);
  vec3 c=col*(trazo*(.55+1.4*pulso)+halo*(.4+pulso));
  float lej=smoothstep(.0,.55,r);
  c*=lej;
  c+=vec3(.55,.35,1.)*.035/(r+.03)*(.6+.4*sin(T*2.));
  c+=vec3(1.,.5,.2)*P*.6*exp(-abs(r-(1.-P))*10.);
  c=c/(1.+c*.6);
  gl_FragColor=vec4(pow(c,vec3(.9)),1.);
}`,
        // 03: raymarching de gotas fundidas con iridiscencia de película delgada
        gel: `
float sm(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec3 bola(float i){return vec3(sin(T*.53+i*2.1)*1.35,sin(T*.41+i*1.3)*.8,cos(T*.37+i*2.7)*.55);}
vec3 MW;
float mapa(vec3 p){
  float d=length(p-MW)-.38;
  for(int i=0;i<6;i++){float fi=float(i);d=sm(d,length(p-bola(fi))-(.34+.1*sin(T*.7+fi*1.9)),.6);}
  return d+.025*sin(p.x*7.+T)*sin(p.y*6.-T*1.2)*sin(p.z*7.+T*.8);
}
vec3 normal(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(mapa(p+e.xyy)-mapa(p-e.xyy),mapa(p+e.yxy)-mapa(p-e.yxy),mapa(p+e.yyx)-mapa(p-e.yyx)));}
vec3 estudio(vec3 r){
  vec3 c=mix(vec3(.02,.02,.05),vec3(.16,.14,.3),smoothstep(-.4,.9,r.y));
  c+=vec3(1.)*pow(max(dot(r,normalize(vec3(-.6,.65,.45))),0.),24.)*2.2;
  c+=vec3(.5,.7,1.)*pow(max(dot(r,normalize(vec3(.8,.1,.6))),0.),10.)*.9;
  c+=vec3(1.,.5,.25)*pow(max(dot(r,normalize(vec3(.1,-.8,.5))),0.),6.)*.5;
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  float kz=max(1.,.85*R.y/R.x);
  MW=vec3((M-.5)*vec2(R.x/R.y,1.)*2.6*kz,.3);
  vec3 ro=vec3(0.,0.,4.2), rd=normalize(vec3(uv*kz,-1.6));
  float t=0.,hit=0.,brillo=0.;
  for(int i=0;i<90;i++){
    float d=mapa(ro+rd*t);
    brillo+=.018/(1.+d*d*40.);
    if(d<.0008){hit=1.;break;}
    t+=d*.85; if(t>9.)break;
  }
  vec3 c=mix(vec3(.012,.012,.03),vec3(.05,.035,.1),uv.y+.5);
  c+=vec3(.55,.4,1.)*brillo*.5;
  if(hit>.5){
    vec3 p=ro+rd*t, n=normal(p), v=-rd;
    float nv=max(dot(n,v),0.);
    float fres=pow(1.-nv,3.);
    vec3 pel=.5+.5*cos(6.28318*(2.4*nv+p.y*.25+T*.05+vec3(0.,.33,.67)));
    vec3 env=estudio(reflect(rd,n));
    float dif=max(dot(n,normalize(vec3(-.5,.7,.6))),0.);
    c=pel*(.06+.22*dif)+env*mix(.35,1.1,fres)*mix(vec3(1.),pel,.75);
    c+=pel*fres*.35;
  }
  c+=vec3(1.,.6,.3)*P*.5*exp(-length(uv-(M-.5)*vec2(R.x/R.y,1.))*6.);
  c=c/(1.+c);
  c*=1.-.35*dot(uv,uv);
  gl_FragColor=vec4(pow(c,vec3(.8)),1.);
}`,
        // 05: caleidoscopio con fractal de plegado (Kali); el cursor cambia espejos y acercamiento
        caleidoscopio: `
vec3 pal(float t){return .5+.5*cos(6.28318*(t+vec3(.05,.35,.6)));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  float N=floor(mix(5.,15.,M.x)+.5);
  float zoom=mix(.7,2.2,M.y);
  float r=length(uv), a=atan(uv.y,uv.x)+T*.06;
  float seg=6.28318/N; a=mod(a,seg); a=abs(a-seg*.5);
  vec2 p=vec2(cos(a),sin(a))*r*zoom+vec2(.25*sin(T*.05),.2*cos(T*.04));
  vec3 c=vec3(0.); vec2 z=p;
  float s=0.;
  for(int i=0;i<7;i++){
    z=abs(z)/dot(z,z)-vec2(.88+.05*sin(T*.11),.64+.05*cos(T*.09));
    float l=length(z);
    float w=exp(-abs(l-1.)*7.);
    c+=pal(float(i)*.13+l*.1+T*.025)*w;
    s+=w;
  }
  c/=max(s,1.2);
  c=pow(c,vec3(1.8))*(1.6+P*1.2);
  c*=.45+.8*smoothstep(1.4,0.,r);
  c=c/(1.+c*.35);
  c*=smoothstep(1.25,.25,r*.9);
  gl_FragColor=vec4(c,1.);
}`,
    };

    const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const BASE = { obsidiana: 1, tunel: 1, gel: .6, caleidoscopio: 1 };

    function crearShader(canvas, nombre) {
        const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
        if (!gl) return null;
        gl.getExtension('OES_standard_derivatives');
        const compilar = (tipo, src) => {
            const s = gl.createShader(tipo);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(nombre, gl.getShaderInfoLog(s));
            return s;
        };
        const prog = gl.createProgram();
        gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, CABECERA + SHADERS[nombre]));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(nombre, gl.getProgramInfoLog(prog)); return null; }
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const u = {};
        ['R', 'T', 'M', 'P'].forEach((k) => (u[k] = gl.getUniformLocation(prog, k)));

        const maximo = BASE[nombre] * (tactil ? .75 : 1);
        let escala = maximo, media = 16, ancho = 0, alto = 0;
        const medir = () => {
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr * escala));
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr * escala));
            if (w !== ancho || h !== alto) { canvas.width = ancho = w; canvas.height = alto = h; gl.viewport(0, 0, w, h); }
        };
        return {
            medir,
            dibujar(t, ptr, dt) {
                // resolución adaptativa: baja si el cuadro tarda, sube si sobra tiempo
                if (dt) {
                    media += (dt * 1000 - media) * .05;
                    if (media > 24 && escala > .35) { escala *= .85; media = 16; }
                    else if (media < 13 && escala < maximo) { escala = Math.min(maximo, escala * 1.08); media = 16; }
                }
                medir();
                gl.uniform2f(u.R, ancho, alto);
                gl.uniform1f(u.T, t);
                gl.uniform2f(u.M, ptr.sx, ptr.sy);
                gl.uniform1f(u.P, ptr.pulso);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            },
        };
    }

    // ================= ENJAMBRE =================
    function crearEnjambre(canvas) {
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0, N = 0, x, y, vx, vy, tx, ty, color;
        let modo = 'flujo', cambio = 0;
        const COLORES = ['#6ea2ff', '#8b9dff', '#a78bfa', '#c084fc', '#f0abfc', '#ff9a5c', '#ff7a2e'];
        const preparar = () => {
            W = canvas.width = Math.round(canvas.clientWidth * dpr);
            H = canvas.height = Math.round(canvas.clientHeight * dpr);
            // muestrear el nombre en un lienzo oculto
            const o = document.createElement('canvas');
            o.width = W; o.height = H;
            const c = o.getContext('2d');
            const texto = W / H < .9 ? 'OLLIN\nTEP' : 'OLLIN-TEP';
            const lineas = texto.split('\n');
            let tam = Math.min(H * (lineas.length > 1 ? .26 : .3), W / (lineas.length > 1 ? 3.4 : 5.6));
            c.font = `800 ${tam}px "Bricolage Grotesque", Figtree, sans-serif`;
            c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
            lineas.forEach((l, i) => c.fillText(l, W / 2, H * .44 + (i - (lineas.length - 1) / 2) * tam * 1.02));
            const datos = c.getImageData(0, 0, W, H).data;
            const paso = Math.max(3, Math.round(Math.sqrt((W * H) / (tactil ? 1100000 : 1700000)) * 4 * dpr / 2));
            const puntos = [];
            for (let j = 0; j < H; j += paso) for (let i = 0; i < W; i += paso) if (datos[(j * W + i) * 4 + 3] > 128) puntos.push(i, j);
            N = puntos.length / 2;
            x = new Float32Array(N); y = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
            tx = new Float32Array(N); ty = new Float32Array(N); color = new Uint8Array(N);
            for (let k = 0; k < N; k++) {
                tx[k] = puntos[k * 2]; ty[k] = puntos[k * 2 + 1];
                x[k] = quieto ? tx[k] : Math.random() * W; y[k] = quieto ? ty[k] : Math.random() * H;
                color[k] = Math.min(COLORES.length - 1, Math.floor((tx[k] / W) * COLORES.length + Math.random() * .8));
            }
            ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
            modo = 'flujo'; cambio = 1.2;
        };
        const dispersar = (px, py) => {
            for (let k = 0; k < N; k++) {
                const dx = x[k] - px, dy = y[k] - py, d = Math.hypot(dx, dy) + 1;
                const f = 26 * dpr * Math.exp(-d / (260 * dpr)) + Math.random() * 3;
                vx[k] += (dx / d) * f; vy[k] += (dy / d) * f;
            }
            modo = 'flujo'; cambio = 2.4;
        };
        return {
            preparar,
            dispersar,
            medir() { if (N && (Math.round(canvas.clientWidth * dpr) !== W || Math.round(canvas.clientHeight * dpr) !== H)) preparar(); },
            dibujar(t, ptr, dt) {
                if (!N) return;
                dt = Math.min(dt || .016, .05);
                cambio -= dt;
                if (cambio <= 0) { modo = modo === 'flujo' ? 'forma' : 'flujo'; cambio = modo === 'forma' ? 8 : 1.8; }
                const px = ptr.sx * W, py = (1 - ptr.sy) * H, radio = 110 * dpr, f = dt * 60;
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = 'rgba(5,7,13,.24)';
                ctx.fillRect(0, 0, W, H);
                for (let k = 0; k < N; k++) {
                    if (modo === 'forma') {
                        vx[k] += (tx[k] - x[k]) * .011 * f; vy[k] += (ty[k] - y[k]) * .011 * f;
                        vx[k] *= Math.pow(.86, f); vy[k] *= Math.pow(.86, f);
                    } else {
                        const a = Math.sin(x[k] * .0035 / dpr + t * .4) * 2.2 + Math.cos(y[k] * .0042 / dpr - t * .3) * 2.2;
                        vx[k] += Math.cos(a) * .32 * dpr * f; vy[k] += Math.sin(a) * .32 * dpr * f;
                        vx[k] *= Math.pow(.94, f); vy[k] *= Math.pow(.94, f);
                    }
                    if (ptr.dentro) {
                        const dx = x[k] - px, dy = y[k] - py, d2 = dx * dx + dy * dy;
                        if (d2 < radio * radio) { const d = Math.sqrt(d2) + .1, e = (1 - d / radio) * 2.4 * dpr * f; vx[k] += (dx / d) * e; vy[k] += (dy / d) * e; }
                    }
                    x[k] += vx[k] * f; y[k] += vy[k] * f;
                    if (x[k] < -20) x[k] += W + 40; else if (x[k] > W + 20) x[k] -= W + 40;
                    if (y[k] < -20) y[k] += H + 40; else if (y[k] > H + 20) y[k] -= H + 40;
                }
                ctx.globalCompositeOperation = 'lighter';
                const s = 1.35 * dpr;
                for (let c = 0; c < COLORES.length; c++) {
                    ctx.fillStyle = COLORES[c];
                    ctx.beginPath();
                    for (let k = 0; k < N; k++) if (color[k] === c) ctx.rect(x[k], y[k], s, s);
                    ctx.fill();
                }
            },
        };
    }

    // ================= MOIRÉ Y TINTA =================
    function crearMoire(sec) {
        const capa = sec.querySelector('.moire');
        return {
            medir() {},
            dibujar(t, ptr) {
                capa.style.setProperty('--x', ((ptr.sx - .5) * 160).toFixed(1) + 'px');
                capa.style.setProperty('--y', ((.5 - ptr.sy) * 160).toFixed(1) + 'px');
            },
        };
    }
    function crearTinta(sec) {
        const turb = sec.querySelector('feTurbulence'), desp = sec.querySelector('feDisplacementMap');
        let agite = 0, lx = 0, ly = 0;
        return {
            medir() {},
            dibujar(t, ptr, dt) {
                const mov = Math.hypot(ptr.x - lx, ptr.y - ly); lx = ptr.x; ly = ptr.y;
                agite = Math.min(1, agite * Math.pow(.96, (dt || .016) * 60) + (ptr.dentro ? mov * 6 : 0) + ptr.pulso * .05);
                turb.setAttribute('baseFrequency', `${(.010 + .003 * Math.sin(t * .45) + agite * .006).toFixed(4)} ${(.026 + .008 * Math.cos(t * .3) + agite * .01).toFixed(4)}`);
                desp.setAttribute('scale', (26 + 14 * Math.sin(t * .8) + agite * 110).toFixed(1));
            },
        };
    }

    // ================= REGISTRO Y BUCLE =================
    document.querySelectorAll('.exp').forEach((sec) => {
        const ptr = crearPuntero(sec);
        const lienzo = sec.querySelector('[data-shader]');
        let motor = null;
        if (lienzo) motor = crearShader(lienzo, lienzo.dataset.shader);
        else if (sec.querySelector('[data-enjambre]')) {
            motor = crearEnjambre(sec.querySelector('[data-enjambre]'));
            sec.addEventListener('pointerdown', (e) => {
                const r = sec.getBoundingClientRect();
                motor.dispersar((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
            });
        } else if (sec.querySelector('.moire')) motor = crearMoire(sec);
        else if (sec.querySelector('.tinta')) motor = crearTinta(sec);
        if (!motor) { sec.classList.add('sin-gl'); return; }
        escenas.push({ sec, ptr, motor, visible: false, t: 0, listo: false });
    });

    const indice = [...document.querySelectorAll('.indice a')];
    const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
            const esc = escenas.find((s) => s.sec === e.target);
            if (esc) esc.visible = e.isIntersecting;
            if (e.isIntersecting && e.intersectionRatio > .3) {
                e.target.classList.add('visto');
                indice.forEach((a) => a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id));
            }
            if (esc && e.isIntersecting && !esc.listo) {
                esc.listo = true;
                if (esc.motor.preparar) {
                    const ir = () => esc.motor.preparar();
                    document.fonts ? document.fonts.ready.then(ir) : ir();
                }
            }
        });
    }, { threshold: [0, .3, .6] });
    document.querySelectorAll('.exp').forEach((s) => obs.observe(s));

    let antes = performance.now();
    const cuadro = (ahora) => {
        const dt = Math.min((ahora - antes) / 1000, .1);
        antes = ahora;
        const impulso = Math.min(velScroll * .004, 3);
        velScroll *= .9;
        for (const e of escenas) {
            if (!e.visible) continue;
            const p = e.ptr;
            // si el cursor no está, una deriva lenta mantiene vivo el experimento
            if (!p.dentro && !quieto) { p.x = .5 + .22 * Math.sin(ahora * .00021 + e.t * .1); p.y = .5 + .16 * Math.cos(ahora * .00017); }
            const k = 1 - Math.pow(.001, dt);
            p.sx += (p.x - p.sx) * k * .9; p.sy += (p.y - p.sy) * k * .9;
            p.pulso = Math.max(0, p.pulso - dt * .8);
            e.t += dt * (e.sec.id === 'tunel' ? 1 + impulso : 1);
            e.motor.dibujar(e.t, p, dt);
        }
        requestAnimationFrame(cuadro);
    };
    if (quieto) {
        // sin movimiento: un cuadro fijo por experimento al cargar y al cambiar de tamaño
        const fijo = () => escenas.forEach((e) => {
            e.ptr.sx = e.ptr.sy = .5;
            if (e.motor.preparar && !e.listo) { e.listo = true; e.motor.preparar(); }
            e.motor.dibujar(20, e.ptr, 0);
        });
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(fijo);
        addEventListener('resize', fijo);
    } else requestAnimationFrame(cuadro);
    addEventListener('resize', () => escenas.forEach((e) => e.motor.medir()));
})();
