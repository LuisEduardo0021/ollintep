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

        // 05: aurora boreal sobre montañas, reflejada en un lago (capas de ruido triangular)
        aurora: `
const mat2 m2=mat2(.95534,.29552,-.29552,.95534);
float tri(float x){return clamp(abs(fract(x)-.5),.01,.49);}
vec2 tri2(vec2 p){return vec2(tri(p.x)+tri(p.y),tri(p.y+tri(p.x)));}
float triRuido(vec2 p,float v){
  float z=1.8,z2=2.5,rz=0.;
  p*=rot(p.x*.06);
  vec2 bp=p;
  for(int i=0;i<5;i++){
    vec2 dg=tri2(bp*1.85)*.75;
    dg*=rot(T*v);
    p-=dg/z2; bp*=1.3; z2*=.45; z*=.42;
    p*=1.21+(rz-1.)*.02;
    rz+=tri(p.x+tri(p.y))*z;
    p*=-m2;
  }
  return clamp(1./pow(rz*29.,1.3),0.,.55);
}
vec4 aurora(vec3 ro,vec3 rd){
  vec4 col=vec4(0.),media=vec4(0.);
  for(int i=0;i<30;i++){
    float fi=float(i);
    float of=.004*hh(gl_FragCoord.xy+fract(T))*smoothstep(0.,15.,fi);
    float pt=((.8+pow(fi,1.4)*.002)-ro.y)/(rd.y*2.+.4)-of;
    vec3 bp=ro+pt*rd;
    float rz=triRuido(bp.zx,.06);
    vec4 c2=vec4((sin(1.-vec3(2.15,-.5,1.2)+fi*.045)*.5+.5)*rz,rz);
    media=mix(media,c2,.5);
    col+=media*exp2(-fi*.065-2.5)*smoothstep(0.,5.,fi);
  }
  col*=clamp(rd.y*15.+.4,0.,1.);
  return col*1.9;
}
float montes(float a){float v=0.,k=.5;for(int i=0;i<5;i++){v+=k*abs(ruido(vec2(a,3.7))*2.-1.);a=a*2.1+1.3;k*=.5;}return v;}
vec3 cielo(vec3 rd){
  vec3 c=mix(vec3(.01,.015,.04),vec3(.02,.05,.1),1.-rd.y);
  vec2 g=vec2(atan(rd.x,rd.z),rd.y)*vec2(90.,90.);
  vec2 id=floor(g),f=fract(g)-.5;
  float h=hh(id);
  if(h>.965){vec2 o=vec2(hh(id+2.),hh(id+5.))-.5;float d=length(f-o*.6);c+=vec3(.85,.9,1.)*exp(-d*d*90.)*(h-.965)*30.*(.7+.3*sin(T*2.+h*40.));}
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  vec3 ro=vec3(0.,0.,-6.7);
  vec3 rd=normalize(vec3(uv+vec2(0.,.12),1.3));
  rd.yz*=rot(-(M.y-.5)*.25);
  rd.xz*=rot((M.x-.5)*.7+T*.015);
  float a=atan(rd.x,rd.z);
  float mh=.02+montes(a*1.6+4.)*.11;
  float mh2=.01+montes(a*3.1+9.)*.06;
  vec3 c;
  if(rd.y>0.){
    c=cielo(rd);
    vec4 au=aurora(ro,rd);
    c=c*(1.-au.a)+au.rgb;
    if(rd.y<mh){float b=smoothstep(mh,mh-.004,rd.y);c=mix(c,vec3(.012,.02,.035)+au.rgb*.08,b);}
    if(rd.y<mh2){float b=smoothstep(mh2,mh2-.003,rd.y);c=mix(c,vec3(.006,.01,.02),b);}
  } else {
    vec3 rr=vec3(rd.x,-rd.y,rd.z);
    rr.y+=.004*sin(rd.z*60./max(-rd.y,.02)*.05+T*1.5)*smoothstep(0.,.2,-rd.y);
    c=cielo(rr)*.5;
    vec4 au=aurora(ro,rr);
    c=c*(1.-au.a)+au.rgb*.55;
    if(rr.y<mh){c=mix(c,vec3(.01,.015,.03),smoothstep(mh,mh-.004,rr.y));}
    if(rr.y<mh2){c=mix(c,vec3(.005,.008,.016),smoothstep(mh2,mh2-.003,rr.y));}
    c*=.8;
    c=mix(c,vec3(.01,.015,.03),smoothstep(0.,.35,-rd.y)*.4);
  }
  c+=vec3(.3,1.,.6)*P*.15*exp(-abs(length(uv)-(1.-P))*10.);
  c*=1.-.2*dot(uv,uv);
  gl_FragColor=vec4(pow(clamp(c,0.,1.),vec3(.9)),1.);
}`,
        // 08: agujero negro con lente gravitacional y disco de acreción
        agujero: `
float fbm3(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*ruido(p);p=p*2.1+3.1;a*=.5;}return v;}
vec3 estrellas(vec2 p){
  vec3 c=vec3(0.);
  for(int k=0;k<2;k++){
    float e=k==0?28.:55.;
    vec2 g=p*e, id=floor(g), f=fract(g)-.5;
    float h=hh(id+float(k)*17.);
    if(h>.9){vec2 o=vec2(hh(id+3.1),hh(id+7.7))-.5;float d=length(f-o*.7);
      c+=mix(vec3(.7,.8,1.),vec3(1.,.85,.7),hh(id+1.3))*exp(-d*d*(k==0?260.:520.))*(h-.9)*14.;}
  }
  return c;
}
vec4 disco(vec2 q,float rs){
  float dr=length(q); if(dr<rs*1.45||dr>rs*5.)return vec4(0.);
  float a=atan(q.y,q.x);
  float x=(dr-rs*1.45)/(rs*3.55);
  float v=fbm3(vec2(a*3.+T*.9/dr*rs*4.,dr*18.));
  float bandas=.55+.45*sin(dr*70.-T*2.+v*5.);
  float dens=smoothstep(0.,.08,x)*smoothstep(1.,.35,x)*(.35+.65*v)*bandas;
  float dop=1.+.75*cos(a+1.4);
  vec3 col=mix(vec3(1.,.95,.85),vec3(1.,.45,.12),smoothstep(0.,.5,x));
  col=mix(col,vec3(.6,.12,.05),smoothstep(.5,1.,x));
  return vec4(col*dens*dop*1.6,clamp(dens*1.4,0.,1.));
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  float rs=.12;
  float r=length(uv);
  float incl=mix(.16,.42,M.y);
  mat2 giro=rot((M.x-.5)*.5);
  vec2 dir=uv/max(r,1e-4);
  vec2 lente=uv-dir*rs*rs*2.2/max(r,rs*.5);
  vec3 c=estrellas(lente+vec2(T*.004,0.));
  c+=vec3(.25,.12,.45)*fbm3(lente*2.5+5.)*.35+vec3(.05,.12,.3)*fbm3(lente*4.-T*.01)*.25;
  vec2 qb=giro*lente; qb.y/=incl;
  vec4 db=disco(qb,rs);
  c=mix(c,db.rgb,db.a*smoothstep(-.02,.03,qb.y));
  c*=smoothstep(rs*.98,rs*1.08,r);
  c+=vec3(1.,.75,.5)*exp(-abs(r-rs*1.12)*90.)*.8;
  vec2 qf=giro*uv; qf.y/=incl;
  vec4 df=disco(qf,rs);
  c=mix(c,df.rgb,df.a*smoothstep(.03,-.02,qf.y));
  c+=vec3(1.,.6,.3)*P*.4*exp(-abs(r-(1.-P)*.9)*12.);
  c=c/(1.+c*.5);
  c*=1.-.3*dot(uv,uv);
  gl_FragColor=vec4(pow(c,vec3(.9)),1.);
}`,
        // 10: ola de cubos (raymarching con repetición de dominio)
        cubos: `
const float S=.5;
vec3 MP;
float altura(vec2 id){
  vec2 w=id*S;
  float h=.35+.25*sin(w.x*1.3+T*1.2)*cos(w.y*1.1+T*.9);
  float dm=length(w-MP.xz);
  h+=.9*exp(-dm*dm*.6)+P*.8*sin(dm*3.-(1.-P)*12.)*exp(-dm*.5);
  return max(h,.05);
}
float caja(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-.03;}
float mapa(vec3 p){
  vec2 id=floor(p.xz/S);
  vec2 l=p.xz-(id+.5)*S;
  float h=altura(id);
  float d=caja(vec3(l.x,p.y-h*.5,l.y),vec3(S*.42-.03,h*.5,S*.42-.03));
  return d;
}
vec3 normal(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(mapa(p+e.xyy)-mapa(p-e.xyy),mapa(p+e.yxy)-mapa(p-e.yxy),mapa(p+e.yyx)-mapa(p-e.yyx)));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  vec3 ro=vec3(6.,6.5,6.), ta=vec3(0.,0.,0.);
  vec3 f=normalize(ta-ro), r=normalize(cross(f,vec3(0,1,0))), u=cross(r,f);
  float z=1.9;
  vec3 rd=normalize(f*z+uv.x*r+uv.y*u);
  vec2 mu=(M-.5)*vec2(R.x/R.y,1.);
  vec3 rm=normalize(f*z+mu.x*r+mu.y*u);
  MP=ro+rm*(-ro.y/rm.y);
  float t=0.,hit=0.;
  for(int i=0;i<110;i++){
    vec3 p=ro+rd*t;
    float d=mapa(p);
    if(d<.001){hit=1.;break;}
    t+=min(d,S*.45); if(t>30.)break;
  }
  vec3 c=mix(vec3(.02,.02,.05),vec3(.07,.04,.13),uv.y+.5);
  if(hit>.5){
    vec3 p=ro+rd*t, n=normal(p);
    vec2 id=floor(p.xz/S);
    float h=altura(id);
    vec3 base=mix(vec3(.25,.45,1.),vec3(.75,.4,1.),smoothstep(.2,.8,h));
    base=mix(base,vec3(1.,.5,.2),smoothstep(.8,1.3,h));
    vec3 L=normalize(vec3(-.4,.9,.3));
    float dif=max(dot(n,L),0.);
    float ao=clamp(.35+p.y/max(h,.1)*.65,0.,1.);
    float tapa=step(.9,n.y);
    c=base*(.18+.9*dif)*ao;
    c+=tapa*base*.25+pow(max(dot(reflect(rd,n),L),0.),30.)*.6;
    c=mix(c,vec3(.02,.02,.05),1.-exp(-max(t-7.,0.)*.12));
  }
  c=c/(1.+c*.4);
  gl_FragColor=vec4(pow(c,vec3(.9)),1.);
}`,
    };

    const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const BASE = { obsidiana: 1, tunel: 1, gel: .6, aurora: .55, agujero: 1, cubos: .65 };

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

    // ================= GLOBO CONECTADO =================
    function crearGlobo(canvas) {
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0;
        const rad = Math.PI / 180;
        const N = tactil ? 1400 : 2600;
        const puntos = Array.from({ length: N }, (_, i) => {
            const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996323;
            return [Math.cos(a) * r, y, Math.sin(a) * r];
        });
        const hub = [21.5, -104.9];
        const CIUDADES = [[19.43, -99.13, 'CDMX'], [20.67, -103.35, ''], [25.69, -100.32, 'MTY'], [34.05, -118.24, 'LA'], [40.71, -74.0, 'NYC'],
            [4.71, -74.07, 'BOG'], [-23.55, -46.63, 'SAO'], [-34.6, -58.38, 'BUE'], [40.42, -3.7, 'MAD'], [51.5, -0.12, 'LON'], [35.68, 139.69, 'TYO'], [49.28, -123.12, 'YVR']];
        const vec = ([la, lo]) => [Math.cos(la * rad) * Math.cos(lo * rad), Math.sin(la * rad), -Math.cos(la * rad) * Math.sin(lo * rad)];
        const H0 = vec(hub);
        const arcos = CIUDADES.map((c, k) => {
            const B = vec(c), d = Math.acos(Math.max(-1, Math.min(1, H0[0] * B[0] + H0[1] * B[1] + H0[2] * B[2])));
            const pts = [];
            for (let q = 0; q <= 48; q++) {
                const s = q / 48, a = Math.sin((1 - s) * d) / Math.sin(d), b = Math.sin(s * d) / Math.sin(d);
                const alto = 1 + Math.sin(Math.PI * s) * d * .22;
                pts.push([(H0[0] * a + B[0] * b) * alto, (H0[1] * a + B[1] * b) * alto, (H0[2] * a + B[2] * b) * alto]);
            }
            return { pts, nombre: c[2], fase: k * .37 };
        });
        return {
            medir() {
                const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
                if (w !== W || h !== H) { canvas.width = W = w; canvas.height = H = h; }
            },
            dibujar(t, ptr, dt) {
                this.medir();
                const giro = .087 + Math.sin(t * .12) * .45 + (ptr.sx - .5) * 2.2, incl = .35 + (ptr.sy - .5) * .7;
                const R = Math.min(W, H) * .36, cx = W * .58, cy = H * .5;
                const cg = Math.cos(giro), sg = Math.sin(giro), ci = Math.cos(incl), si = Math.sin(incl);
                const proy = ([x, y, z]) => {
                    const x1 = x * cg - z * sg, z1 = x * sg + z * cg;
                    const y2 = y * ci - z1 * si, z2 = y * si + z1 * ci;
                    return [cx + x1 * R, cy - y2 * R, z2];
                };
                ctx.clearRect(0, 0, W, H);
                // atmósfera
                const at = ctx.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.35);
                at.addColorStop(0, 'rgba(110,162,255,.22)'); at.addColorStop(1, 'rgba(110,162,255,0)');
                ctx.fillStyle = at; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, 7); ctx.fill();
                const cuerpo = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R);
                cuerpo.addColorStop(0, '#13213f'); cuerpo.addColorStop(1, '#070c18');
                ctx.fillStyle = cuerpo; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
                // puntos: atrás tenues, adelante brillantes
                for (let pase = 0; pase < 2; pase++) {
                    ctx.fillStyle = pase ? '#a9c6ff' : 'rgba(110,162,255,.22)';
                    ctx.beginPath();
                    for (const p of puntos) {
                        const [x, y, z] = proy(p);
                        if ((z > 0) !== !!pase) continue;
                        const s = pase ? (.9 + z * 1.1) * dpr : .8 * dpr;
                        ctx.rect(x - s / 2, y - s / 2, s, s);
                    }
                    ctx.fill();
                }
                // arcos con un paquete que viaja
                ctx.lineCap = 'round';
                arcos.forEach((a) => {
                    const ciclo = (t * .18 + a.fase) % 1.4, cab = Math.min(1, ciclo / .7), cola = Math.max(0, (ciclo - .7) / .7);
                    const q0 = Math.floor(cola * 48), q1 = Math.floor(cab * 48);
                    let previo = null;
                    for (let q = q0; q <= q1; q++) {
                        const p = proy(a.pts[q]);
                        if (previo) {
                            const vis = Math.min(previo[2], p[2]) > -.15 ? 1 : .15;
                            ctx.strokeStyle = `rgba(255,${Math.round(150 - q)},${Math.round(80 + q)},${.85 * vis})`;
                            ctx.lineWidth = 1.6 * dpr;
                            ctx.beginPath(); ctx.moveTo(previo[0], previo[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
                        }
                        previo = p;
                    }
                    if (cab < 1 && previo && previo[2] > -.15) {
                        const g = ctx.createRadialGradient(previo[0], previo[1], 0, previo[0], previo[1], 7 * dpr);
                        g.addColorStop(0, 'rgba(255,220,180,1)'); g.addColorStop(1, 'rgba(255,122,46,0)');
                        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(previo[0], previo[1], 7 * dpr, 0, 7); ctx.fill();
                    }
                    const fin = proy(a.pts[48]);
                    if (fin[2] > 0 && a.nombre) {
                        ctx.fillStyle = 'rgba(255,190,140,.9)'; ctx.beginPath(); ctx.arc(fin[0], fin[1], 2.2 * dpr, 0, 7); ctx.fill();
                        ctx.fillStyle = `rgba(226,232,240,${Math.min(1, fin[2] * 2) * .8})`;
                        ctx.font = `600 ${10 * dpr}px Figtree, sans-serif`;
                        ctx.fillText(a.nombre, fin[0] + 5 * dpr, fin[1] - 4 * dpr);
                    }
                });
                // Tepic, el origen
                const h = proy(H0);
                if (h[2] > -.1) {
                    const pul = (t * .8) % 1;
                    ctx.strokeStyle = `rgba(255,122,46,${1 - pul})`; ctx.lineWidth = 1.5 * dpr;
                    ctx.beginPath(); ctx.arc(h[0], h[1], (4 + pul * 18) * dpr, 0, 7); ctx.stroke();
                    ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.arc(h[0], h[1], 3.6 * dpr, 0, 7); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.font = `700 ${12 * dpr}px Figtree, sans-serif`; ctx.textAlign = 'right';
                    ctx.fillText('Tepic', h[0] - 9 * dpr, h[1] + 4 * dpr); ctx.textAlign = 'left';
                }
            },
        };
    }

    // ================= CAMPO MAGNÉTICO =================
    function crearCampo(canvas) {
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0, signo = 1;
        const medir = () => {
            const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
            if (w !== W || h !== H) { canvas.width = W = w; canvas.height = H = h; }
        };
        return {
            medir,
            invertir() { signo *= -1; },
            dibujar(t, ptr) {
                medir();
                ctx.fillStyle = '#05070d';
                ctx.fillRect(0, 0, W, H);
                const paso = (tactil ? 26 : 30) * dpr, largo = paso * .42;
                // tres polos: el cursor y dos que orbitan
                const polos = [
                    [ptr.sx * W, (1 - ptr.sy) * H, 1.4 * signo],
                    [W / 2 + Math.cos(t * .4) * W * .28, H / 2 + Math.sin(t * .53) * H * .28, -1],
                    [W / 2 + Math.cos(t * .31 + 2) * W * .3, H / 2 + Math.sin(t * .27 + 1) * H * .3, .8],
                ];
                ctx.lineCap = 'round';
                ctx.lineWidth = 1.6 * dpr;
                const cubetas = [[], [], [], [], []];
                for (let y = paso / 2; y < H; y += paso) {
                    for (let x = paso / 2; x < W; x += paso) {
                        let fx = 0, fy = 0;
                        for (const [px, py, q] of polos) {
                            const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy + 900 * dpr * dpr;
                            const k = q / (d2 * Math.sqrt(d2));
                            fx += dx * k; fy += dy * k;
                        }
                        const m = Math.hypot(fx, fy) || 1e-9;
                        const fuerza = Math.min(1, Math.log10(m * 1e6 * dpr * dpr + 1) / 2.2);
                        const l = largo * (.35 + .65 * fuerza);
                        const ux = (fx / m) * l, uy = (fy / m) * l;
                        cubetas[Math.min(4, Math.floor(fuerza * 5))].push(x - ux, y - uy, x + ux, y + uy);
                    }
                }
                const COL = ['#2a3a6b', '#4f6fd8', '#8b7cff', '#c084fc', '#ffb07a'];
                cubetas.forEach((c, i) => {
                    ctx.strokeStyle = COL[i];
                    ctx.beginPath();
                    for (let k = 0; k < c.length; k += 4) { ctx.moveTo(c[k], c[k + 1]); ctx.lineTo(c[k + 2], c[k + 3]); }
                    ctx.stroke();
                });
                polos.forEach(([px, py, q]) => {
                    const g = ctx.createRadialGradient(px, py, 0, px, py, 26 * dpr);
                    g.addColorStop(0, q > 0 ? 'rgba(255,176,122,.9)' : 'rgba(110,162,255,.9)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(px, py, 26 * dpr, 0, Math.PI * 2); ctx.fill();
                });
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
        else if (sec.querySelector('[data-globo]')) motor = crearGlobo(sec.querySelector('[data-globo]'));
        else if (sec.querySelector('[data-campo]')) {
            motor = crearCampo(sec.querySelector('[data-campo]'));
            sec.addEventListener('pointerdown', () => motor.invertir());
        }
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
