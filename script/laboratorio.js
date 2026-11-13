/* Laboratorio visual de Ollin-Tep: shaders WebGL, enjambre de partículas, moiré y tinta.
   Cada experimento solo se dibuja mientras está en pantalla; la resolución se adapta al equipo. */
(() => {
    const EN = document.documentElement.lang === 'en';
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tactil = matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const MAPA_TIERRA = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADI/wMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA/v8/IOb//z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMD+///P////////AAAAAAAAAAB4AAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAPj//3/+//////8fAAAAwB0AAHz/AwAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAGPD//wf8//////8DAACA/z8AAAAAAAAAAP8EAAAAAAAAAAAAAAAAAAAAAAB4+N3///n//////38AAACA/wcAAAAAAAAAAIBfAAAAAAAAAAAAAAAAAAAAAOA4RHjyP/D///////8DAAAAPA4AAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAP7H+Pv/P8D///////8DAAAAEAAAAAAA8gEAALj/HwAAAAAAAAAAAAAAAAAAAOD//7//HwAA/v////8DAAAAAAAAAADgDwAA4P//PwAA6N8BAAAAAAAAAAAAAA8cAHD/DwAA+P////8BAAAAAAAAAAD4AAAA/P//HwAAAAEAAAAAAAAAAAAAgP8Dx/f5fwAA8P////8AAAAAAAAAAAA+AAzw/////4cfAAcAAAAAAAAAAAAAwP9/x3/8/wEA8P///z8AAAAAAAAAAAAPAJ7+//////8/gP8BAAAAAwCAAAAAAO//D3/8/x8A8P///z8AAAAAAAAAAAAPgP////////8///8PAACAAAD4/wAAEMD/P/j4//8A4P///z8AAAAAAPwHAAAcgN//////////////DwAAAAD+///z/5//f/7D//8B4P///w8AAAAA4P8/ADCAn9///////////////99/A+D/////////H/7Ph/8BgP///wMAAAAA/P//B4P/////////////////////HwD/////////////h/kfwP//BwAAAAAA/P//H/P//9///////////////////8P/////////////A/x/wP//AyAYAAAA/v////////////////////////////H/////////////gf8dgP9/APA/AAAA//N/8P//////////////////////4MD/////////////w/8HAP8PAOA/AADA//P//v////////////////////9/AAf+///////////jRPAPAP4HAIADAADw//z///////////////////////9/AID///////////8Aw+cPAP4DAAAAAAD8P/7/////////////////////////AMD//////////38AwB8AAPgDAAAAAAD+H/7/////////////////////+f8DAOD//////////z8AwH8IAOABAAAAAAT+f/7/////////////////////wH8AAAD8N4D//////x8AwH8cAAAAAAAAAAD+f/j///////////////////9/8AAAAAD0DwD8/////38A4P8/AAAAAAAAoAGcH/z//////////////////wMAeAAAAADADgDw//////8AgP9/AAAAAAAA8APAX/b//////////////////wAAfgAAAAAwAgDg//////8PkP9/AAAAAAAA4ANwH/7/////////////////PwAAfwAAAAAeAADA////////wP//AAAAAAAA8AfwB/7/////////////////HwCAPwAAAIABAACA/v//////8///BwAAAAAA/A/w8///////////////////PwCAPwAAADgAAACA/v//////4///DwAAAAAAPA/+/////////////////////wUADwAAAAAAAAAA+f//////5///DwAAAAAAvD///////////////////////w8ABwAADAAAAAAA8P//////////HwAAAAAAjJ///////////////////////w8AAwAAAAAAAAAA8P//////////DQAAAAAAgOf//////////////////////w2AAAAAAAAAAAAA4P////////8xPAAAAAAAAPz//////////////////////w0AAAAAAAAAAAAAgP////////8PfgAAAAAAgP///////////////////////wQAAAAAAAAAAAAAgP////////8P/gAAAAAAAP7/////////////////////fwQAAAAAAAAAAAAAAP////////+fQAAAAAAAAPz//////R/+////////////PwwAAAAAAAAAAAAAAP//////////AAAAAAAAAPj////j/w/+////////////PwIBAAAAAAAAAAAAAP////////8fAAAAAAAAAPj//f9h/of/////////////Dw4AAAAAAAAAAAAAAP///////z8EAAAAAAAA+P/H8/8B8If/////////////Bz4AAAAAAAAAAAAAgP///////z8AAAAAAAAA+H/gx/8A4A/+//////////9/AA8AAAAAAAAAAAAAAP///////z8AAAAAAAAA+H8gn//54R/8//////////8/AAEAAAAAAAAAAAAAAP///////wcAAAAAAAAA+B8wvP///z/+/////////98fAAMAAAAAAAAAAAAAAP///////wMAAAAAAAAA+I8wEM///x/8/////////28OAAMAAAAAAAAAAAAAAP///////wEAAAAAgAAA+A8AGN///x/8/////////wMegAMAAAAAAAAAAAAAAP7//////wEAAAAAAAAA+AcADv7//x/8/////////38cwAEAAAAAAAAAAAAAAPz//////wAAAAAAAAAAwOJ/AIT3/////////////x888AEAAAAAAAAAAAAAAPj//////wEAAAAAAAAAQPx/ADAg/////////////w88/gEAAAAAAAAAAAAAAPj/////fwAAAAAAAAAA4P9/AAAA/////////////w+MfwAAAAAAAAAAAAAAAOD/////HwAAAAAAAAAA8P//AACA/////////////x/kDwAAAAAAAAAAAAAAAID/////DwAAAAAAAAAA+P//BweA/////////////x/AAAAAAAAAAAAAAAAAAID/////BwAAAAAAAAAA/P//D3/M/////////////z9AAAAAAAAAAAAAAAAAAAD7////BwAAAAAAAAAA/P///////////////////z8AAAAAAAAAAAAAAAAAAAD//78HBwAAAAAAAAAA/P///////9///////////z8AAAAAAAAAAAAAAAAAAAD0/w8ADgAAAAAAAAAM/////////5///////////z8AAAAAAAAAAAAAAAAAAADu/wcADgAAAAAAAACA//////+//x///////////x8AAAAAAAAAAAAAAAAAAADY/wcATAAAAAAAAADA//////8//z/s/////////w8AAAAAAAAAAAAAAAAAAACQ/wcADAAAAAAAAADg//////9//v/Y/////////w8AAAAAAAAAAAAAAAAAAAAw/wcAYAAAAAAAAADg//////9//v8egP///////zcAAAAAAAAAAAAAAAAAAABg/gMAAAEAAAAAAADw/////////P9/AP///////zEAAAAAAAAAAAAAAAAAAAAA/AMAPwIAAAAAAAD4////////+f//AP7/////fxAAAAAAAAAAAAAAAAAAAAAA/Acc8AAAAAAAAAD4////////+f//AP7/H///HwAAAAAAAAAAAACAAAAAAAAA/AcewAMAAAAAAAD4////////+f9/AOD/B/9/BAAAAAAAAAAAAAAAAQAAAAAA+A8eAHgAAAAAAAD4////////4f8/AOD/A/4/BgAAAAAAAAAAAAAAAAAAAAAA8P8PQPwCAAAAAADw////////4/8fAOD/APw/AiAAAAAAAAAAAAAAAAAAAAAAwP8PAAAAAAAAAADw////////x/8PAOB/APx/AHAAAAAAAAAAAAAAAAAAAAAAAP8PAABAAAAAAAD4////////x/8BAOA/APz/ADAAAAAAAAAAAAAAAAAAAAAAAMj/AQAAAAAAABD4////////z/8AAMAfAMD/ATAAAAAAAAAAAAAAAAAAAAAAAAD/AQAAAAAAAAD4////////nz8AAMAPAMD/AXAAAAAAAAAAAAAAAAAAAAAAAAD8AQAAAAAAAAD4/////////wcAAIAfAMD/A/AAAAAAAAAAAAAAAAAAAAAAAADgARAAAAAAAAD4/////////wAAAIAPAMH+A6ABAAAAAAAAAAAAAAAAAAAAAADAAHwAAAAAAADw/////////3AAAIAPAMD4AcgDAAAAAAAAAAAAAAAAAAAAAADAAf9/AAAAAADg/////////38AAAAPAED4AMgDAAAAAAAAAAAAAAAAAAAAAACAE/9/AAAAAADA/////////38AAAAfAMBgAMQDAAAAAAAAAAAAAAAAAAAAAAAA////AQAAAACA/////////z8AAAASAMAAAIIHAAAAAAAAAAAAAAAAAAAAAAAAzP//AwAAAACA/////////z8AAAAwAIABAMAHAAAAAAAAAAAAAAAAAAAAAAAAwP//BwAAAAAA/v///////x8AAAAwAAADAAMDAAAAAAAAAAAAAAAAAAAAAAAAwP//fwAAAAAA/A/+/////x8AAAAAABgHgAcAAAAAAAAAAAAAAAAAAAAAAAAAwP///wEAAAAAEAD8/////w8AAAAAADAPwAcAAAAAAAAAAAAAAAAAAAAAAAAAwP///wEAAAAAAADw/////wcAAAAAAOAO4AMAAAAAAAAAAAAAAAAAAAAAAAAA4P///wMAAAAAAADA/////wMAAAAAAOAP+AMQAAAAAAAAAAAAAAAAAAAAAAAA4P///wMAAAAAAADg/////wEAAAAAAIAf/gcYAAAAAAAAAAAAAAAAAAAAAAAA8P///wMAAAAAAADg////fwAAAAAAAIAP/vMZAAAAAAAAAAAAAAAAAAAAAAAD+P///x8AAAAAAADg////fwAAAAAAAAAf/ivIAwAAAAAAAAAAAAAAAAAAAAAA+P///38AAAAAAADg////PwAAAAAAAAA//vnAMwAAAAAAAAAAAAAAAAAAAAAA+P////8DAAAAAADA////HwAAAAAAAAB+/DkA9wEEAAAAAAAAAAAAAAAAAAAA+P////8fAAAAAACA////DwAAAAAAAAA80Hl8/g8AAAAAAAAAAAAAAAAAAAAA/P////9/AAAAAACA////DwAAAAAAAAA4AHgA+D8YAAAAAAAAAAAAAAAAAAAA+P//////AQAAAAAA////DwAAAAAAAAAwAFgAxL9PAAAAAAAAAAAAAAAAAAAA+P//////AQAAAAAA////DwAAAAAAAADgDQAAxP+AAAAAAAAAAAAAAAAAAAAA8P//////AQAAAAAA/v//DwAAAAAAAACAPwCEwP8AAAAAAAAAAAAAAAAAAAAA4P//////AQAAAAAA/v//DwAAAAAAAAAA+P8HQM8BCgAAAAAAAAAAAAAAAAAA4P//////AQAAAAAA/v//DwAAAAAAAAAAABgBAIAHMAAAAAAAAAAAAAAAAAAAwP//////AAAAAAAA/v//HwAAAAAAAAAAAIAAAAQGIAAAAAAAAAAAAAAAAAAAwP////9/AAAAAAAA/P//HwAAAAAAAAAAAADAEwQAAAAAAAAAAAAAAAAAAAAAgP////8/AAAAAAAA/v//HyAAAAAAAAAAAADAHw4AAAAAgAAAAAAAAAAAAAAAAP////8fAAAAAAAA////HzAAAAAAAAAAAADAHw4AAAAAAAAAAAAAAAAAAAAAAP////8fAAAAAAAA////HzgAAAAAAAAAAADuDx4AAAAAAAAAAAAAAAAAAAAAAP7///8fAAAAAAAA////H3wAAAAAAAAAAAD/Hz4AAAgAAAAAAAAAAAAAAAAAAPj///8fAAAAAAAA////Dz8AAAAAAAAAAID/vz4AABiAAAAAQAAAAAAAAAAAAPD///8fAAAAAACA////Az8AAAAAAAAAAMD//z8AAABgAAAAAAAAAAAAAAAAAOD///8fAAAAAAAA////AT8AAAAAAAAAAMD//38AAAAAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA/v9/AB8AAAAAAAAAAOD///8AAAAAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA/v9/AB8gAAAAAAAAAP7///8BAAEAAAAAAAAAAAAAAAAAAMD///8HAAAAAAAA/P9/gA8IAAAAAAAAgP////8DAAIAAAAAAAAAAAAAAAAAAMD///8HAAAAAAAA/P//gA8AAAAAAAAAwP////8HAAQAAAAAAAAAAAAAAAAAAOD//38AAAAAAAAA/P//gA8AAAAAAAAA4P////8HAAAAAAAAAAAAAAAAAAAAAOD//x8AAAAAAAAA/P9/AA8AAAAAAAAA4P////8PAAAAAAAAAAAAAAAAAAAAAOD//w8AAAAAAAAA+P8fAAMAAAAAAAAA4P////8fAAAAAAAAAAAAAAAAAAAAAOD//w8AAAAAAAAA+P8fAAAAAAAAAAAA4P////8fAAAAAAAAAAAAAAAAAAAAAOD//w8AAAAAAAAA+P8fAAAAAAAAAAAAwP////8/AAAAAAAAAAAAAAAAAAAAAPD//wcAAAAAAAAA8P8fAAAAAAAAAAAAwP////8/AAAAAAAAAAAAAAAAAAAAAPD//wMAAAAAAAAA4P8PAAAAAAAAAAAAgP////8/AAAAAAAAAAAAAAAAAAAAAPD//wMAAAAAAAAA4P8HAAAAAAAAAAAAgP////8fAAAAAAAAAAAAAAAAAAAAAPD//wEAAAAAAAAAwP8DAAAAAAAAAAAAgP////8fAAAAAAAAAAAAAAAAAAAAAPD//wAAAAAAAAAAwP8BAAAAAAAAAAAAgP8H/P8fAAAAAAAAAAAAAAAAAAAAAPD/fwAAAAAAAAAAwP8AAAAAAAAAAAAAgP8A+P8PAAAAAAAAAAAAAAAAAAAAAPD/PwAAAAAAAAAAgAMAAAAAAAAAAAAAgAcA6P8HAAAAAAAAAAAAAAAAAAAAAPj/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P8HAAAGAAAAAAAAAAAAAAAAAPj/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP8DAAAMAAAAAAAAAAAAAAAAAPz/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8DAAAIAAAAAAAAAAAAAAAAAPz/AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAA8AAAAAAAAAAAAAAAAAPg/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAPw/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABABAAAZAAAAAAAAAAAAAAAAAPwHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOABAAAPAAAAAAAAAAAAAAAAAPwfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAIADCAAAAAAAAAAAAAAAAP4HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAOABAAAAAAAAAAAAAAAAAP4HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwAAAAAAAAAAAAAAAAAAP8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAP4DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6AAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/AAAAAAAAAAAAAAAAAMAfAAAAgP//fIDn/wAAAAAAAAAAAAAAAAAAAAAAAIAHAAAAAAAAAAAAAAAAAP7/PwDA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAg8P///wP8//////////9/AAAAAAAAAAAAAAAAAAAAAPg/AAAAAAAAAAAAAADg+////wP/////////////DwAAAAAAAAAAAAAAAAAAAPN/AAAAAAAAIIJ//17///////H/////////////3wcAAAAAAAAAAAAAAAAAAP9/AAAAAAAA//////////////j//////////////38AAAAAAAAAAAAAoA8AAHr/AAAAAACA////////////f////////////////z8AAAAAAAAAYAYA4P///f//AAAAAAD4/////////////////////////////y8AAAAAAACA8f43gP////9/AAAAAAD8/////////////////////////////wEAAAAAAPT///////////8fAAAAAOD/////////////////////////////fwAAAAAA4P///////////38AAAAAwP//////////////////////////////fwAAAADg/////////////wcAAAAA/v///////////////////////////////xwAAAAA////////////P4AAAPwA/////////////////////////////////wcAAAAf8v///////////3ADAP4B+///////////////////////////////HwAAAAAAwP///////////yH6wT8A////////////////////////////////HwAAAACA//////////////8PAAD8////////////////////////////////PwAAAAAA/P////////////9/8P///////////////////////////////////wMAAP7///////////////////////////////////////////////////////8B/4//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////';

    // --- Idioma ---
    const idioma = document.querySelector('[data-idioma]');
    if (idioma) {
        idioma.textContent = EN ? 'ES' : 'EN';
        idioma.href = EN ? location.pathname.replace(/^\/en(?=\/)/, '') : '/en' + location.pathname;
        idioma.addEventListener('click', () => { try { localStorage.setItem('ollintep-idioma', EN ? 'es' : 'en'); } catch (e) {} });
    }

    // --- En pantallas táctiles no hay cursor: las instrucciones hablan del dedo (el deslizamiento horizontal mueve el experimento) ---
    if (tactil) {
        const CAMBIOS = EN ? [
            ['Move the cursor and scroll', 'Swipe sideways and scroll'], ['Your cursor is one more drop.', 'Your finger is one more drop.'],
            ['Tap or click to scatter them.', 'Tap to scatter them.'], ['Move the cursor to', 'Swipe sideways to'],
            ['Hover over them to stir them up.', 'Swipe across them to stir them up.'], ['wherever your cursor goes; click to send', 'wherever your finger goes; tap to send'],
            ['; click to pull', '; tap to pull'], ['Click to flip', 'Tap to flip'],
        ] : [
            ['Mueve el cursor y desplázate', 'Desliza de lado y desplázate'], ['Tu cursor es una gota más.', 'Tu dedo es una gota más.'],
            ['Toca o haz clic para dispersarlas.', 'Toca para dispersarlas.'], ['Mueve el cursor para', 'Desliza el dedo de lado para'],
            ['Pasa el cursor por encima para agitarlas.', 'Desliza el dedo encima para agitarlas.'], ['Donde pasa tu cursor, se levantan; con un clic, lanzas', 'Donde pasa tu dedo, se levantan; con un toque, lanzas'],
            ['; con un clic se separan', '; con un toque se separan'], ['Haz clic para invertir', 'Toca para invertir'],
        ];
        document.querySelectorAll('.exp-texto p, .pista').forEach(p => {
            const nodo = [...p.childNodes].filter(n => n.nodeType === 3).pop();
            if (!nodo) return;
            let t = nodo.textContent;
            CAMBIOS.forEach(([a, b]) => { t = t.replace(a, b); });
            nodo.textContent = t;
        });
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
        el.addEventListener('pointercancel', () => { p.dentro = false; });
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
uniform sampler2D U; uniform float K;
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
    vec4 au=texture2D(U,gl_FragCoord.xy/R)*K;
    c=c*(1.-au.a)+au.rgb;
    if(rd.y<mh){float b=smoothstep(mh,mh-.004,rd.y);c=mix(c,vec3(.012,.02,.035)+au.rgb*.08,b);}
    if(rd.y<mh2){float b=smoothstep(mh2,mh2-.003,rd.y);c=mix(c,vec3(.006,.01,.02),b);}
  } else {
    vec3 rr=vec3(rd.x,-rd.y,rd.z);
    rr.y+=.004*sin(rd.z*60./max(-rd.y,.02)*.05+T*1.5)*smoothstep(0.,.2,-rd.y);
    c=cielo(rr)*.5;
    vec4 au=texture2D(U,gl_FragCoord.xy/R)*K;
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
// Trazado de rayos de Schwarzschild (unidades: radio del horizonte = 1). Cada rayo se curva hacia el centro;
// donde cruza el plano del disco se acumula su luz. Así el disco de atrás se ve por encima y por debajo
// del agujero y se une sin cortes con el de adelante, y el anillo de fotones aparece solo.
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
const float RIN=3., ROUT=9.5;
vec4 disco(vec3 p,vec3 v){
  float r=length(p.xz); if(r<RIN||r>ROUT)return vec4(0.);
  float x=(r-RIN)/(ROUT-RIN);
  // el gas gira más rápido cerca del centro; el ruido se toma del punto girado (sin costura en ningún ángulo)
  vec2 q=rot(T*2.2/pow(r,1.5))*p.xz;
  float w=fbm3(q*.9+vec2(r*.35,0.));
  float w2=ruido(q*2.6);
  float bandas=.72+.28*sin(r*4.3-T*1.5+w*6.);
  float dens=smoothstep(0.,.07,x)*smoothstep(1.,.25,x)*(.3+.7*w)*(.8+.4*w2)*bandas;
  // brillo Doppler: el lado que viene hacia nosotros se ve más intenso
  vec3 vt=normalize(vec3(-p.z,0.,p.x));
  float dop=pow(clamp(1.+.55*dot(vt,-normalize(v))*sqrt(RIN/r),.25,2.),2.5);
  vec3 col=mix(vec3(1.,.95,.85),vec3(1.,.45,.12),smoothstep(0.,.45,x));
  col=mix(col,vec3(.6,.12,.05),smoothstep(.45,1.,x));
  return vec4(col*dens*dop*1.5,clamp(dens*1.5,0.,1.));
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  uv=rot((M.x-.5)*.5)*uv;
  float elev=asin(mix(.16,.42,M.y));
  float D=20.;
  vec3 ro=D*vec3(0.,sin(elev),-cos(elev));
  vec3 f=normalize(-ro), ri=normalize(cross(vec3(0.,1.,0.),f)), up=cross(f,ri);
  vec3 rd=normalize(f+uv.x*ri+uv.y*up);
  // fuera de r=14 la curvatura es mínima: el rayo llega en línea recta hasta esa esfera
  float bq=dot(ro,rd), cq=dot(ro,ro)-196., disc=bq*bq-cq;
  vec3 pos=ro+rd*max(0.,-bq-sqrt(max(disc,0.))), vel=rd;
  vec3 hv=cross(pos,vel); float h2=dot(hv,hv);
  vec3 acum=vec3(0.); float alfa=0., dentro=0.;
  for(int i=0;i<90;i++){
    if(disc<0.)break;
    float r2=dot(pos,pos), r=sqrt(r2);
    if(r<1.){dentro=1.;break;}
    if(r>ROUT+1.&&dot(pos,vel)>0.)break;
    // paso largo lejos del agujero y fino cerca del anillo de fotones (r≈1.5); integración de salto de rana
    float dt=clamp(.13*r*smoothstep(1.,2.6,r)+.03,.03,1.2);
    vec3 antes=pos;
    vec3 ac=-1.5*h2*pos/(r2*r2*r);
    pos+=vel*dt+.5*ac*dt*dt;
    float n2=dot(pos,pos);
    vel+=.5*(ac-1.5*h2*pos/(n2*n2*sqrt(n2)))*dt;
    if(antes.y*pos.y<0.){
      vec3 cruce=mix(antes,pos,antes.y/(antes.y-pos.y));
      vec4 d=disco(cruce,vel);
      acum+=(1.-alfa)*d.rgb; alfa+=(1.-alfa)*d.a;
      if(alfa>.98)break;
    }
  }
  vec3 c=vec3(0.);
  if(dentro<.5){
    vec3 dir=normalize(vel);
    vec2 cielo=vec2(atan(dir.x,dir.z),asin(clamp(dir.y,-1.,1.)))*.8;
    c=estrellas(cielo+vec2(T*.004,0.));
    c+=vec3(.25,.12,.45)*fbm3(cielo*2.5+5.)*.35+vec3(.05,.12,.3)*fbm3(cielo*4.-T*.01)*.25;
  }
  c=c*(1.-alfa)+acum;
  c+=vec3(1.,.6,.3)*P*.4*exp(-abs(length(uv)-(1.-P)*.9)*12.);
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
  // el bloque más alto mide como mucho ~2.35: el rayo empieza justo encima y se corta bajo el suelo
  float t=max(0.,(ro.y-2.4)/max(-rd.y,1e-3)),hit=0.;
  for(int i=0;i<160;i++){
    vec3 p=ro+rd*t;
    if(p.y<-.05||t>30.)break;
    float d=mapa(p);
    if(d<.001){hit=1.;break;}
    // nunca cruzar a la celda vecina de un salto: ahí el bloque de al lado podría estar más cerca
    vec2 lim=(floor(p.xz/S)+step(0.,rd.xz))*S;
    vec2 tc=(lim-p.xz)/(rd.xz+sign(rd.xz)*1e-5+vec2(1e-6));
    t+=max(min(d,min(tc.x,tc.y)+.002),.0008);
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

    // Capas suaves: lo difuso (la luz de la aurora) se calcula a media resolución en una textura
    // y el shader principal lo compone a resolución completa con los bordes nítidos (estrellas, montes, lago).
    const SUAVES = {
        aurora: `uniform float K;
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
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  vec3 ro=vec3(0.,0.,-6.7);
  vec3 rd=normalize(vec3(uv+vec2(0.,.12),1.3));
  rd.yz*=rot(-(M.y-.5)*.25);
  rd.xz*=rot((M.x-.5)*.7+T*.015);
  vec4 au;
  if(rd.y>0.) au=aurora(ro,rd);
  else {
    vec3 rr=vec3(rd.x,-rd.y,rd.z);
    rr.y+=.004*sin(rd.z*60./max(-rd.y,.02)*.05+T*1.5)*smoothstep(0.,.2,-rd.y);
    au=aurora(ro,rr);
  }
  gl_FragColor=au/K;
}`,
    };

    const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    // Tope de píxeles por cuadro: hasta ahí se dibuja a resolución nativa (nítido en Full HD y laptops);
    // en pantallas enormes (retina grande, 4K) se reparte el tope para no ahogar la GPU.
    const TOPE = { obsidiana: 3.2e6, tunel: 3.2e6, gel: 2.4e6, aurora: 2.4e6, agujero: 3.2e6, cubos: 2.4e6 };

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
        const programa = (src) => {
            const prog = gl.createProgram();
            gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS));
            gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, CABECERA + src));
            gl.bindAttribLocation(prog, 0, 'a');
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(nombre, gl.getProgramInfoLog(prog)); return null; }
            const u = {};
            ['R', 'T', 'M', 'P', 'U', 'K'].forEach((k) => (u[k] = gl.getUniformLocation(prog, k)));
            return { prog, u };
        };
        const principal = programa(SHADERS[nombre]);
        if (!principal) return null;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Capa suave (si el experimento la tiene): textura a media resolución; en coma flotante si se puede
        let capa = null;
        if (SUAVES[nombre]) {
            const prog = programa(SUAVES[nombre]);
            const medio = gl.getExtension('OES_texture_half_float');
            const lineal = medio && gl.getExtension('OES_texture_half_float_linear');
            gl.getExtension('EXT_color_buffer_half_float');
            const tex = gl.createTexture(), fbo = gl.createFramebuffer();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            let tipo = medio && lineal ? medio.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
            const reservar = (w, h) => {
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, tipo, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
                const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                return ok;
            };
            if (prog) capa = { prog, tex, fbo, reservar, w: 0, h: 0, get tipo() { return tipo; }, aBytes() { tipo = gl.UNSIGNED_BYTE; } };
        }

        const tope = (TOPE[nombre] || 2.4e6) * (tactil ? .6 : 1);
        const maximoPara = () => Math.min(1, Math.sqrt(tope / Math.max(1, canvas.clientWidth * canvas.clientHeight * dpr * dpr)));
        let maximo = maximoPara(), escala = maximo, media = 16, ancho = 0, alto = 0;
        // piso de la resolución adaptativa: en celulares lentos puede bajar más para no ir a tirones
        const piso = tactil ? .45 : .6;
        addEventListener('resize', () => { maximo = maximoPara(); escala = Math.min(escala, maximo); });
        const medir = () => {
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr * escala));
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr * escala));
            if (w !== ancho || h !== alto) { canvas.width = ancho = w; canvas.height = alto = h; }
            if (capa) {
                const cw = Math.max(1, Math.round(ancho * .5)), ch = Math.max(1, Math.round(alto * .5));
                if (cw !== capa.w || ch !== capa.h) {
                    capa.w = cw; capa.h = ch;
                    if (!capa.reservar(cw, ch) && capa.tipo !== gl.UNSIGNED_BYTE) { capa.aBytes(); capa.reservar(cw, ch); }
                }
            }
        };
        const uniformes = (p, w, h, t, ptr) => {
            gl.uniform2f(p.u.R, w, h);
            gl.uniform1f(p.u.T, t);
            gl.uniform2f(p.u.M, ptr.sx, ptr.sy);
            gl.uniform1f(p.u.P, ptr.pulso);
        };
        return {
            medir,
            dibujar(t, ptr, dt) {
                // resolución adaptativa: baja si el cuadro tarda, sube si sobra tiempo
                if (dt) {
                    media += (dt * 1000 - media) * .05;
                    if (media > 24 && escala > piso) { escala = Math.max(piso, escala * .88); media = 16; }
                    else if (media < 13 && escala < maximo) { escala = Math.min(maximo, escala * 1.08); media = 16; }
                }
                medir();
                // en 8 bits la luz se guarda a la mitad para que los brillos no se saturen
                const K = capa && capa.tipo === gl.UNSIGNED_BYTE ? 2 : 1;
                if (capa) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, capa.fbo);
                    gl.viewport(0, 0, capa.w, capa.h);
                    gl.useProgram(capa.prog.prog);
                    uniformes(capa.prog, capa.w, capa.h, t, ptr);
                    gl.uniform1f(capa.prog.u.K, K);
                    gl.drawArrays(gl.TRIANGLES, 0, 3);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, capa.tex);
                }
                gl.viewport(0, 0, ancho, alto);
                gl.useProgram(principal.prog);
                uniformes(principal, ancho, alto, t, ptr);
                if (capa) { gl.uniform1i(principal.u.U, 0); gl.uniform1f(principal.u.K, K); }
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            },
        };
    }

    // ================= ENJAMBRE =================
    function crearEnjambre(canvas) {
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0, N = 0, x, y, vx, vy, tx, ty, color, rangos = [];
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
            // cada partícula recibe su color y se ordenan por color: así cada color se dibuja de un tramo
            const col = new Uint8Array(N);
            for (let k = 0; k < N; k++) col[k] = Math.min(COLORES.length - 1, Math.floor((puntos[k * 2] / W) * COLORES.length + Math.random() * .8));
            const orden = Array.from({ length: N }, (_, k) => k).sort((a, b) => col[a] - col[b]);
            rangos = COLORES.map(() => [N, 0]);
            orden.forEach((o, k) => {
                tx[k] = puntos[o * 2]; ty[k] = puntos[o * 2 + 1]; color[k] = col[o];
                x[k] = quieto ? tx[k] : Math.random() * W; y[k] = quieto ? ty[k] : Math.random() * H;
                const r = rangos[col[o]]; r[0] = Math.min(r[0], k); r[1] = k + 1;
            });
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
                const freno = Math.pow(modo === 'forma' ? .86 : .94, f), atraer = .011 * f, empuje = .32 * dpr * f;
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = 'rgba(5,7,13,.24)';
                ctx.fillRect(0, 0, W, H);
                for (let k = 0; k < N; k++) {
                    if (modo === 'forma') {
                        vx[k] += (tx[k] - x[k]) * atraer; vy[k] += (ty[k] - y[k]) * atraer;
                        vx[k] *= freno; vy[k] *= freno;
                    } else {
                        const a = Math.sin(x[k] * .0035 / dpr + t * .4) * 2.2 + Math.cos(y[k] * .0042 / dpr - t * .3) * 2.2;
                        vx[k] += Math.cos(a) * empuje; vy[k] += Math.sin(a) * empuje;
                        vx[k] *= freno; vy[k] *= freno;
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
                    for (let k = rangos[c][0]; k < rangos[c][1]; k++) ctx.rect(x[k], y[k], s, s);
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
        const vec = ([la, lo]) => [Math.cos(la * rad) * Math.cos(lo * rad), Math.sin(la * rad), -Math.cos(la * rad) * Math.sin(lo * rad)];
        // Máscara de tierra 360×180 (1 bit por grado) a partir de Natural Earth 1:50m, dominio público
        const TIERRA = Uint8Array.from(atob(MAPA_TIERRA), (ch) => ch.charCodeAt(0));
        const esTierra = (la, lo) => {
            const i = Math.min(359, Math.max(0, Math.floor(lo + 180))), j = Math.min(179, Math.max(0, Math.floor(90 - la)));
            const n = j * 360 + i;
            return (TIERRA[n >> 3] >> (n & 7)) & 1;
        };
        const N = tactil ? 9000 : 16000;
        const lista = [];
        for (let i = 0; i < N; i++) {
            const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996323;
            const x = Math.cos(a) * r, z = Math.sin(a) * r;
            if (esTierra(Math.asin(y) / rad, Math.atan2(-z, x) / rad)) lista.push(x, y, z);
        }
        const puntos = Float32Array.from(lista), NP = puntos.length / 3, PX = new Float32Array(NP), PY = new Float32Array(NP), PZ = new Float32Array(NP);
        // meridianos y paralelos cada 30°
        const reticula = [];
        for (let lo = -180; lo < 180; lo += 30) reticula.push(Array.from({ length: 37 }, (_, k) => vec([-90 + k * 5, lo])));
        for (let la = -60; la <= 60; la += 30) reticula.push(Array.from({ length: 73 }, (_, k) => vec([la, -180 + k * 5])));
        const hub = [21.5, -104.9];
        const CIUDADES = [[19.43, -99.13, 'CDMX'], [20.67, -103.35, ''], [25.69, -100.32, 'MTY'], [34.05, -118.24, 'LA'], [40.71, -74.0, 'NYC'],
            [4.71, -74.07, 'BOG'], [-23.55, -46.63, 'SAO'], [-34.6, -58.38, 'BUE'], [40.42, -3.7, 'MAD'], [51.5, -0.12, 'LON'], [35.68, 139.69, 'TYO'], [49.28, -123.12, 'YVR']];
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
                // retícula: solo la cara visible
                ctx.strokeStyle = 'rgba(110,162,255,.13)'; ctx.lineWidth = 1 * dpr;
                ctx.beginPath();
                reticula.forEach((linea) => {
                    let antes = null;
                    linea.forEach((q) => {
                        const p = proy(q);
                        if (p[2] > 0 && antes && antes[2] > 0) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
                        antes = p;
                    });
                });
                ctx.stroke();
                // continentes en puntos: atrás tenues, adelante brillantes y más grandes hacia el centro
                for (let i = 0, j = 0; i < NP; i++, j += 3) {
                    const x = puntos[j], y = puntos[j + 1], z = puntos[j + 2];
                    const x1 = x * cg - z * sg, z1 = x * sg + z * cg;
                    PX[i] = cx + x1 * R; PY[i] = cy - (y * ci - z1 * si) * R; PZ[i] = y * si + z1 * ci;
                }
                [['rgba(110,162,255,.14)', .9, -9, 0], ['#7fa6ef', 1.4, 0, .5], ['#c3d7ff', 1.8, .5, 9]].forEach(([col, tam, z0, z1], k) => {
                    ctx.fillStyle = col;
                    ctx.beginPath();
                    for (let i = 0; i < NP; i++) {
                        const z = PZ[i]; if (z < z0 || z >= z1) continue;
                        const s = (k ? tam * (.75 + z * .35) : tam) * dpr; ctx.rect(PX[i] - s / 2, PY[i] - s / 2, s, s);
                    }
                    ctx.fill();
                });
                // arcos con un paquete que viaja
                ctx.lineCap = 'round';
                // los tramos de todos los arcos se agrupan por tono (8) y visibilidad (2): 16 trazos por cuadro en vez de cientos
                const BANDAS = 8, tramos = Array.from({ length: BANDAS * 2 }, () => []);
                const cabezas = [];
                arcos.forEach((a) => {
                    const ciclo = (t * .18 + a.fase) % 1.4, cab = Math.min(1, ciclo / .7), cola = Math.max(0, (ciclo - .7) / .7);
                    const q0 = Math.floor(cola * 48), q1 = Math.floor(cab * 48);
                    let previo = null;
                    for (let q = q0; q <= q1; q++) {
                        const p = proy(a.pts[q]);
                        if (previo) tramos[Math.min(BANDAS - 1, (q * BANDAS / 49) | 0) * 2 + (Math.min(previo[2], p[2]) > -.15 ? 1 : 0)].push(previo[0], previo[1], p[0], p[1]);
                        previo = p;
                    }
                    cabezas.push([a, cab, previo]);
                });
                ctx.lineWidth = 1.6 * dpr;
                tramos.forEach((seg, k) => {
                    if (!seg.length) return;
                    const q = ((k >> 1) + .5) * 49 / BANDAS, vis = k & 1 ? 1 : .15;
                    ctx.strokeStyle = `rgba(255,${Math.round(150 - q)},${Math.round(80 + q)},${.85 * vis})`;
                    ctx.beginPath();
                    for (let i = 0; i < seg.length; i += 4) { ctx.moveTo(seg[i], seg[i + 1]); ctx.lineTo(seg[i + 2], seg[i + 3]); }
                    ctx.stroke();
                });
                cabezas.forEach(([a, cab, previo]) => {
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
    // 07: la palabra se dibuja nítida en una textura y la GPU la deforma con ruido suave; el borde se recorta
    // con antialiasing exacto (fwidth), así que sigue definido aunque la tinta se estire mucho
    const TINTA_FS = `
uniform sampler2D U; uniform sampler2D V; uniform sampler2D W; uniform vec4 B; uniform float A; uniform float H; uniform vec2 O;
// ruido con interpolación quíntica: sin pliegues, así el borde de la tinta se curva suave
float rs(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(hh(i),hh(i+vec2(1,0)),u.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){return .62*rs(p)+.25*rs(rot(.6)*p*2.02+3.1);}
vec2 campo(vec2 p){
  vec2 q=vec2(fbm(p+vec2(0.,T*.10)),fbm(p+vec2(5.2,1.3)-T*.08));
  return vec2(fbm(p+1.5*q+vec2(1.7,9.2)+T*.07),fbm(p+1.5*q+vec2(8.3,2.8)-T*.06))-.42;
}
// fwidth se acota: junto a los píxeles descartados la derivada no está definida
float cubre(float v){if(v<.08)return 0.;float w=min(fwidth(v)*.7,.2)+1e-4;return smoothstep(.5-w,.5+w,v);}
// V es la palabra muy desenfocada: entre dos letras casi pegadas vale mucho y cierra la rendija; en el borde exterior no alcanza
float tinta(vec2 q){return max(texture2D(U,q).r,(texture2D(V,q).r-.3)*1.3);}
void main(){
  vec2 f=gl_FragCoord.xy, p=f/H;
  // lejos de toda letra (más de lo que la tinta puede estirarse) no hay nada que calcular
  if(texture2D(W,f/R).r<.006){gl_FragColor=vec4(0.);return;}
  vec2 m=M*R; vec2 dm=(f-m)/H; float d=length(dm);
  float cerca=exp(-d*d*1.6);
  vec2 w=campo(p*.75)*(.16+.06*sin(T*.6)+A*.42+cerca*.16);
  // la tinta cae un poco, como en agua
  w.y+=(rs(vec2(p.x*1.4,T*.15))-.5)*.06*(1.+A);
  // al hacer clic sale una onda desde el cursor
  float anillo=(1.-P)*1.6;
  w+=normalize(dm+1e-4)*exp(-pow((d-anillo)*4.,2.))*P*.18;
  vec2 o=w*H/R, uv=f/R;
  float vp=tinta(uv+o);
  float vr=tinta(uv+o*1.18+vec2(O.x,-O.y)/R);
  float vb=tinta(uv+o*.84+vec2(-O.x,O.y)/R);
  float ap=cubre(vp), ar=cubre(vr)*.9, ab=cubre(vb)*.9;
  // degradado de la tinta: azul arriba a la izquierda, morado, naranja abajo a la derecha (como el SVG original)
  float g=clamp(((f.x-B.x)/(B.z-B.x)+(B.w-f.y)/(B.w-B.y))*.5,0.,1.);
  vec3 c1=vec3(.431,.635,1.),c2=vec3(.753,.518,.988),c3=vec3(1.,.478,.18);
  vec3 grad=g<.5?mix(c1,c2,g*2.):mix(c2,c3,g*2.-1.);
  // brillo interior que se mueve con la tinta
  grad+=.08*(rs(p*1.6+w*4.+T*.05)-.5);
  vec3 cr=vec3(1.,.239,.431), cb=vec3(.239,.863,1.);
  vec3 col=1.-(1.-cr*ar)*(1.-cb*ab);
  float a=max(ar,ab);
  col=col*(1.-ap)+grad*ap; a=a*(1.-ap)+ap;
  // halo tenue donde la tinta se disuelve
  float halo=smoothstep(.04,.5,vp)*(1.-ap)*.22;
  col+=grad*halo; a=max(a,halo);
  // col ya va multiplicado por su cobertura: se entrega premultiplicado, en un solo dibujo y sin mezcla
  gl_FragColor=vec4(min(col,vec3(a)),a);
}`;
    function crearTinta(sec) {
        const svg = sec.querySelector('.tinta'), txt = svg.querySelector('.tinta-p');
        const canvas = document.createElement('canvas');
        canvas.className = 'tinta-gl';
        canvas.setAttribute('aria-hidden', 'true');
        const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true, depth: false, stencil: false });
        if (!gl || !gl.getExtension('OES_standard_derivatives')) return crearTintaSVG(sec);
        const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error('tinta', gl.getShaderInfoLog(s)); return s; };
        const prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, CABECERA + TINTA_FS));
        gl.bindAttribLocation(prog, 0, 'a');
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return crearTintaSVG(sec);
        gl.useProgram(prog);
        const u = {};
        ['R', 'T', 'M', 'P', 'U', 'V', 'W', 'B', 'A', 'H', 'O'].forEach((k) => (u[k] = gl.getUniformLocation(prog, k)));
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const textura = (unidad) => {
            const t = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + unidad);
            gl.bindTexture(gl.TEXTURE_2D, t);
            [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            return t;
        };
        const tex = textura(0), tex2 = textura(1), tex3 = textura(2);
        gl.uniform1i(u.U, 0); gl.uniform1i(u.V, 1); gl.uniform1i(u.W, 2);
        sec.append(canvas);
        sec.classList.add('tinta-con-gl');
        svg.querySelector('g')?.removeAttribute('filter');   // el SVG queda solo como texto accesible

        const mascara = document.createElement('canvas'), mc = mascara.getContext('2d');
        const nitida = document.createElement('canvas'), nc = nitida.getContext('2d');
        let caja = { x: 0, y: 0, w: 1, h: 1 }, k = dpr, esc = 1, listo = false;
        let agite = 0, lx = 0, ly = 0;
        const medir = () => {
            // el lienzo cubre la palabra con margen para que la tinta pueda salirse
            const rs = sec.getBoundingClientRect(), rv = svg.getBoundingClientRect();
            if (!rv.width) return;
            esc = rv.width / 1200;
            const mx = rv.width * .06, my = rv.height * .25;
            caja = { x: rv.left - rs.left - mx, y: rv.top - rs.top - my, w: rv.width + mx * 2, h: rv.height + my * 2 };
            k = Math.min(dpr, Math.sqrt(2.6e6 / (caja.w * caja.h)));
            Object.assign(canvas.style, { left: caja.x + 'px', top: caja.y + 'px', width: caja.w + 'px', height: caja.h + 'px' });
            canvas.width = mascara.width = Math.round(caja.w * k);
            canvas.height = mascara.height = Math.round(caja.h * k);
            // la palabra, con la misma fuente, tamaño y espaciado que el SVG
            const cs = getComputedStyle(txt);
            const fs = parseFloat(cs.fontSize) * esc * k, ls = (parseFloat(cs.letterSpacing) || 0) * esc * k;
            // las letras se juntan primero en un lienzo aparte (se solapan por el espaciado negativo)
            nitida.width = mascara.width; nitida.height = mascara.height;
            nc.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
            nc.fillStyle = '#fff'; nc.textBaseline = 'alphabetic';
            const letras = [...(txt.textContent || '').trim()];
            const anchos = letras.map((l) => nc.measureText(l).width);
            const total = anchos.reduce((s, a) => s + a, 0) + ls * (letras.length - 1);
            let x = (rv.left - rs.left + rv.width / 2 - caja.x) * k - total / 2;
            const base = (rv.top - rs.top + 270 * esc - caja.y) * k;
            if ('letterSpacing' in nc) {
                // la palabra entera de una vez: dibujar letra por letra deja costuras donde se solapan
                nc.letterSpacing = ls + 'px';
                nc.fillText(letras.join(''), x, base);
            } else letras.forEach((l, i) => { nc.fillText(l, x, base); x += anchos[i] + ls; });
            // la palabra se desenfoca un poco (U: el borde queda como rampa suave que el shader recorta limpio a cualquier escala)
            // y mucho (V: sirve para cerrar las rendijas entre letras; W: marca hasta dónde puede llegar la tinta)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);   // el lienzo 2D tiene y hacia abajo; GL, hacia arriba
            [[tex, 0, 1.4], [tex2, 1, 6], [tex3, 2, 40]].forEach(([t, unidad, radio]) => {
                mc.filter = 'none';
                mc.fillStyle = '#000'; mc.fillRect(0, 0, mascara.width, mascara.height);
                mc.filter = `blur(${(radio * esc * k).toFixed(2)}px)`;
                mc.drawImage(nitida, 0, 0);
                mc.filter = 'none';
                gl.activeTexture(gl.TEXTURE0 + unidad);
                gl.bindTexture(gl.TEXTURE_2D, t);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mascara);
            });
            gl.viewport(0, 0, canvas.width, canvas.height);
            const bx = (rv.left - rs.left + rv.width * .2 - caja.x) * k, bw = rv.width * .6 * k;
            const byArr = (rv.bottom - rs.top - rv.height * .2 - caja.y) * k, bh = rv.height * .55 * k;
            // caja del degradado en coordenadas GL (y hacia arriba)
            gl.uniform4f(u.B, bx, canvas.height - byArr, bx + bw, canvas.height - byArr + bh);
            gl.uniform1f(u.H, rv.height * .5 * k);
            gl.uniform2f(u.O, 7 * esc * k, 2 * esc * k);
            listo = true;
        };
        return {
            preparar: medir,
            medir() { if (listo) medir(); },
            dibujar(t, ptr, dt) {
                if (!listo) return;
                const mov = Math.hypot(ptr.x - lx, ptr.y - ly); lx = ptr.x; ly = ptr.y;
                agite = Math.min(1, agite * Math.pow(.96, (dt || .016) * 60) + (ptr.dentro ? mov * 6 : 0) + ptr.pulso * .05);
                const rs = sec.getBoundingClientRect();
                // puntero de la sección (0..1, y arriba) → píxeles del lienzo de la tinta, normalizados
                const px = (ptr.sx * rs.width - caja.x) / caja.w, py = ((1 - ptr.sy) * rs.height - caja.y) / caja.h;
                gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
                gl.uniform2f(u.R, canvas.width, canvas.height);
                gl.uniform1f(u.T, t);
                gl.uniform2f(u.M, px, 1 - py);
                gl.uniform1f(u.P, ptr.pulso);
                gl.uniform1f(u.A, agite);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            },
        };
    }
    // sin WebGL: el filtro SVG original
    function crearTintaSVG(sec) {
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

    // 12: el logo de Ollin-Tep extruido en 3D desde su dibujo vectorial (mismas coordenadas que resources/ollintep.svg)
    function crearMarca(canvas) {
        const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
        if (!gl) return null;
        // --- contornos del SVG (viewBox 236×225, y hacia abajo) ---
        const arco = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
        const cubica = (p0, p1, p2, p3, n) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]); });
        const PIEZAS = [
            { color: [0.086, 0.157, 0.31], z: 0, grosor: 26, puntos: [[0, 222.289], [0, 95.5572], [126.054, 0], [180.949, 0], [180.949, 225], [128.087, 222.289]] },
            { color: [0.102, 0.337, 0.859], z: 16, grosor: 18, puntos: [[123.343, 170.105], ...arco(179.593, 56.25, 56.25, Math.PI, Math.PI * 2.49, 72), [180.271, 112.495], [180.271, 170.105]] },
            { color: [0.043, 0.388, 0.965], z: 30, grosor: 18, puntos: arco(179.593, 168.75, 56.25, 0, Math.PI * 2, 96).slice(0, -1) },
            { color: [0.102, 0.337, 0.859], z: 16, grosor: 12, puntos: [...cubica([0, 182.053], [4.50337, 204.596], [24.2991, 221.619], [48.1133, 221.848], 24), [48.1172, 221.852], [0, 221.852]] },
        ];
        // triangulación por orejas (los contornos son simples; algunos tienen vértices cóncavos)
        const area = (p) => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2;
        const orejas = (p) => {
            const idx = p.map((_, i) => i); if (area(p) < 0) idx.reverse();
            const tri = [], cruz = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
            let guarda = 0;
            while (idx.length > 3 && guarda++ < 10000) {
                let hecho = false;
                for (let i = 0; i < idx.length; i++) {
                    const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
                    const a = p[ia], b = p[ib], c = p[ic];
                    if (cruz(a, b, c) <= 1e-9) continue;
                    const dentro = idx.some(j => j !== ia && j !== ib && j !== ic && cruz(a, b, p[j]) > 0 && cruz(b, c, p[j]) > 0 && cruz(c, a, p[j]) > 0);
                    if (dentro) continue;
                    tri.push(ia, ib, ic); idx.splice(i, 1); hecho = true; break;
                }
                if (!hecho) break;
            }
            if (idx.length === 3) tri.push(...idx);
            return tri;
        };
        // malla: frente, fondo y paredes (normales suaves en las curvas, planas en las esquinas)
        const datos = [], piezaDe = [];
        PIEZAS.forEach((pz, n) => {
            const p = pz.puntos.map(([x, y]) => [(x - 118) / 112.5, -(y - 112.5) / 112.5]);   // centrado, y hacia arriba, ~[-1,1]
            const zf = pz.z / 112.5, zb = (pz.z - pz.grosor) / 112.5;
            const v = (x, y, z, nx, ny, nz) => datos.push(x, y, z, nx, ny, nz, n);
            const t = orejas(p);
            for (let i = 0; i < t.length; i += 3) {
                [t[i], t[i + 1], t[i + 2]].forEach(k => v(p[k][0], p[k][1], zf, 0, 0, 1));
                [t[i + 2], t[i + 1], t[i]].forEach(k => v(p[k][0], p[k][1], zb, 0, 0, -1));
            }
            const ccw = area(p) > 0, L = p.length;
            const normal = (i) => { const a = p[i], b = p[(i + 1) % L]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); if (!ccw) { nx = -nx; ny = -ny; } const d = Math.hypot(nx, ny) || 1; return [nx / d, ny / d]; };
            for (let i = 0; i < L; i++) {
                const a = p[i], b = p[(i + 1) % L], ne = normal(i);
                const suave = (j, otra) => { const o = normal(otra); return ne[0] * o[0] + ne[1] * o[1] > 0.9 ? [(ne[0] + o[0]) / 2, (ne[1] + o[1]) / 2] : ne; };
                const na = suave(i, (i + L - 1) % L), nb = suave(i + 1, (i + 1) % L);
                const q = [[a, na, zf], [b, nb, zf], [b, nb, zb], [a, na, zb]];
                const orden = ccw ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3];
                orden.forEach(k => v(q[k][0][0], q[k][0][1], q[k][2], q[k][1][0], q[k][1][1], 0));
            }
        });
        const malla = new Float32Array(datos), cuenta = malla.length / 7;
        const VS3 = `attribute vec3 p; attribute vec3 n; attribute float k;
uniform mat4 MV; uniform mat4 PR; uniform float S; varying vec3 vn; varying vec3 vp; varying float vk;
void main(){ vec3 q=p; q.z+=S*k*.28; q.xy*=1.+S*.018*k; vec4 m=MV*vec4(q,1.); vp=m.xyz; vn=mat3(MV)*n; vk=k; gl_Position=PR*m; }`;
        const FS3 = `precision highp float; varying vec3 vn; varying vec3 vp; varying float vk;
uniform vec3 C0; uniform vec3 C1; uniform vec3 C2; uniform vec3 C3; uniform vec2 L;
void main(){
  vec3 base=vk<.5?C0:vk<1.5?C1:vk<2.5?C2:C3;
  vec3 N=normalize(vn), V=normalize(-vp);
  if(dot(N,V)<0.)N=-N;
  vec3 l1=normalize(vec3(L,1.2)), l2=normalize(vec3(-.8,-.4,.6));
  float d=max(dot(N,l1),0.)*.85+max(dot(N,l2),0.)*.25+.18;
  vec3 h=normalize(l1+V); float s=pow(max(dot(N,h),0.),70.)*.9+pow(max(dot(N,h),0.),12.)*.12;
  float fr=pow(1.-max(dot(N,V),0.),3.);
  // las paredes son algo más oscuras que el frente: el volumen se lee sin perder el color de la marca
  float cara=abs(N.z);
  vec3 col=base*d*mix(.72,1.,cara)+vec3(.85,.92,1.)*s+vec3(.35,.6,1.)*fr*.9;
  gl_FragColor=vec4(pow(col,vec3(.95)),1.);
}`;
        const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error('marca', gl.getShaderInfoLog(s)); return s; };
        const prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS3)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS3));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, malla, gl.STATIC_DRAW);
        [['p', 3, 0], ['n', 3, 12], ['k', 1, 24]].forEach(([nombre, tam, off]) => { const loc = gl.getAttribLocation(prog, nombre); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, tam, gl.FLOAT, false, 28, off); });
        const u = {}; ['MV', 'PR', 'S', 'C0', 'C1', 'C2', 'C3', 'L'].forEach(k => (u[k] = gl.getUniformLocation(prog, k)));
        PIEZAS.forEach((pz, i) => gl.uniform3fv(u['C' + i], pz.color));
        gl.enable(gl.DEPTH_TEST);
        // matrices
        const mul = (a, b) => { const r = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; } return r; };
        const rotY = (a) => new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1]);
        const rotX = (a) => new Float32Array([1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1]);
        const mover = (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
        const perspectiva = (f, asp, n, l) => { const t = 1 / Math.tan(f / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (l + n) / (n - l), -1, 0, 0, 2 * l * n / (n - l), 0]); };
        let W = 0, H = 0, separar = 0, objetivo = 0, giro = 0, vel = 0;
        const medir = () => {
            const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
            if (w !== W || h !== H) { canvas.width = W = w; canvas.height = H = h; }
        };
        return {
            medir,
            separar() { objetivo = objetivo ? 0 : 1; vel += 2.5; },
            dibujar(t, ptr, dt) {
                medir();
                dt = dt || .016;
                separar += (objetivo - separar) * (1 - Math.pow(.02, dt));
                vel *= Math.pow(.2, dt);
                giro += (0.25 + vel) * dt;
                gl.viewport(0, 0, W, H);
                gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                const asp = W / H, ancho = asp < 1 ? 1.25 / asp : 1;
                // el cursor inclina el logo; además gira despacio solo, con un vaivén
                const yaw = Math.sin(giro * .8) * .55 + (ptr.sx - .5) * 1.5, pitch = (ptr.sy - .5) * -.9 + .08;
                const MV = mul(mover(asp > 1.2 ? .55 : 0, asp > 1.2 ? 0 : .25, -6.4 * ancho), mul(rotX(pitch), rotY(yaw)));
                gl.uniformMatrix4fv(u.MV, false, MV);
                gl.uniformMatrix4fv(u.PR, false, perspectiva(.62, asp, .1, 50));
                gl.uniform1f(u.S, separar);
                gl.uniform2f(u.L, (ptr.sx - .5) * 2.2, (ptr.sy - .5) * 2.2 + .6);
                gl.drawArrays(gl.TRIANGLES, 0, cuenta);
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
        else if (sec.querySelector('[data-marca]')) {
            motor = crearMarca(sec.querySelector('[data-marca]'));
            if (motor) sec.addEventListener('pointerdown', () => motor.separar());
        } else if (sec.querySelector('[data-campo]')) {
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
