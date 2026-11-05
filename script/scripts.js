// --- Entrada del hero: el título se parte en palabras para que aparezcan una a una ---
// Va fuera de DOMContentLoaded a propósito: el script está al final del <body>, el título ya existe, y partirlo antes
// del primer pintado evita que se vea entero un instante y luego desaparezca para animarse
(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const partir = (nodo) => {
        [...nodo.childNodes].forEach(hijo => {
            if (hijo.nodeType === Node.TEXT_NODE) {
                const frag = document.createDocumentFragment();
                hijo.textContent.split(/(\s+)/).forEach(trozo => {
                    if (!trozo) return;
                    if (/^\s+$/.test(trozo)) { frag.appendChild(document.createTextNode(trozo)); return; }
                    const w = document.createElement('span');
                    w.className = 'w';
                    w.style.setProperty('--i', i++);
                    w.textContent = trozo;
                    frag.appendChild(w);
                });
                hijo.replaceWith(frag);
            } else if (hijo.nodeType === Node.ELEMENT_NODE) {
                partir(hijo);
            }
        });
    };
    document.querySelectorAll('.hero h1').forEach(h1 => {
        h1.setAttribute('aria-label', h1.textContent.trim().replace(/\s+/g, ' '));
        partir(h1);
        h1.classList.add('h1-intro');
        h1.style.setProperty('--words', i);
    });
    document.documentElement.classList.add('intro');
})();

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Menú Móvil (Hamburguesa): el panel se desliza con una transición CSS de transform ---
    const mobileMenu = document.querySelector('#mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (mobileMenu && navLinks) {
        const toggleMobileMenu = (forceClose = false) => {
            if (forceClose) {
                navLinks.classList.remove('active');
                mobileMenu.classList.remove('is-active');
                mobileMenu.setAttribute('aria-expanded', 'false');
            } else {
                const isActive = navLinks.classList.toggle('active');
                mobileMenu.classList.toggle('is-active', isActive);
                mobileMenu.setAttribute('aria-expanded', String(isActive));
            }
        };

        mobileMenu.addEventListener('click', () => toggleMobileMenu());

        // Cerrar menú al hacer clic en un enlace (móvil)
        document.querySelectorAll('.nav-links a').forEach(item => {
            item.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) toggleMobileMenu(true);
            });
        });
    }

    // --- Indicador que se desliza bajo el enlace activo del menú (solo escritorio) ---
    const navUl = document.querySelector('.nav-links');
    const pildora = navUl ? document.createElement('span') : null;
    if (pildora) {
        pildora.className = 'nav-pill';
        pildora.setAttribute('aria-hidden', 'true');
        navUl.prepend(pildora);
        navUl.classList.add('has-pill');
    }
    function moverPildora() {
        if (!pildora) return;
        const activo = navUl.querySelector('a.active');
        if (!activo || window.innerWidth <= 868) { pildora.classList.remove('is-on'); return; }
        pildora.style.width = activo.offsetWidth + 'px';
        pildora.style.transform = `translateX(${activo.offsetLeft}px)`;
        pildora.classList.add('is-on');
    }
    window.addEventListener('resize', moverPildora, { passive: true });

    // --- Resaltado de la sección activa en el menú ---
    const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const anchorById = new Map(navAnchors.map(a => [a.getAttribute('href').slice(1), a]));
    const trackedSections = [...document.querySelectorAll('section[id]')].filter(s => anchorById.has(s.id));

    if (trackedSections.length) {
        const inBand = new Set();
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => entry.isIntersecting ? inBand.add(entry.target) : inBand.delete(entry.target));
            const current = trackedSections.find(s => inBand.has(s));
            if (!current) return; // entre secciones: se queda la última activa
            navAnchors.forEach(a => a.classList.toggle('active', a === anchorById.get(current.id)));
            moverPildora();
        }, { rootMargin: '-150px 0px -55% 0px' });
        trackedSections.forEach(s => sectionObserver.observe(s));
    }

    // --- Año actual en el footer ---
    const currentYear = document.querySelector('#current-year');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // --- Botón volver arriba ---
    const backToTop = document.querySelector('#back-to-top');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    // --- Header dinámico + barra de progreso de scroll ---
    const header = document.querySelector('.header');
    const scrollProgress = document.querySelector('#scroll-progress');

    // Anillo de progreso alrededor del botón «volver arriba»
    let anilloProgreso = null;
    if (backToTop) {
        backToTop.insertAdjacentHTML('beforeend', '<svg class="btt-anillo" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24.5" pathLength="1"></circle></svg>');
        anilloProgreso = backToTop.querySelector('.btt-anillo circle');
    }

    function updateScrollChrome() {
        const scrollTop = window.scrollY;
        if (header) header.classList.toggle('is-scrolled', scrollTop > 10);
        if (scrollProgress) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const p = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
            scrollProgress.style.transform = `scaleX(${p})`;
            if (anilloProgreso) anilloProgreso.style.strokeDashoffset = (1 - p).toFixed(4);
        }
    }
    window.addEventListener('scroll', updateScrollChrome, { passive: true });
    updateScrollChrome();

    // --- Animación de aparición al hacer scroll ---
    const revealTargets = document.querySelectorAll(
        '.service-card, .stat, .tech-panel, .blog-card, .contact-info, .section-title, .plan-card, .video-card, ' +
        '.path-card, .fact, .block-head, .app-tile, .work-card, .service-list li, .principles-head, .principle, .cta-band, ' +
        '.giro-grid li, .feature-col, .shot'
    );
    revealTargets.forEach(el => el.classList.add('reveal'));

    // Escalona el orden de aparición: las tarjetas de una misma grid entran
    // una tras otra en vez de todas de golpe, para que el scroll se sienta
    // más vivo sin depender de una sola animación grande.
    const staggerGroups = new Map();
    revealTargets.forEach(el => {
        const group = el.parentElement;
        if (!staggerGroups.has(group)) staggerGroups.set(group, []);
        staggerGroups.get(group).push(el);
    });
    staggerGroups.forEach(group => {
        group.forEach((el, i) => { el.style.transitionDelay = Math.min(i * 80, 320) + 'ms'; });
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealTargets.forEach(el => revealObserver.observe(el));

    // --- Conteo animado de las estadísticas al entrar en pantalla ---
    const statNumbers = document.querySelectorAll('.stat-number');
    const prefersReducedMotionForCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (statNumbers.length && !prefersReducedMotionForCount) {
        const parseStat = (text) => {
            const match = text.trim().match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/);
            if (!match) return null;
            const [, prefix, numberPart, suffix] = match;
            const decimals = (numberPart.split('.')[1] || '').length;
            return { prefix, value: parseFloat(numberPart), decimals, suffix };
        };

        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                countObserver.unobserve(el);

                const parsed = parseStat(el.textContent);
                if (!parsed) return;

                const duration = 1200;
                const start = performance.now();

                const step = (now) => {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = parsed.value * eased;
                    el.textContent = `${parsed.prefix}${current.toFixed(parsed.decimals)}${parsed.suffix}`;
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(el => countObserver.observe(el));
    }

    // --- Interacciones con el mouse (solo en dispositivos con puntero fino) ---
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // --- Inclinación 3D con el ratón, elástica (interpolada por fotograma) ---
    // Usa la propiedad «rotate» (eje + ángulo) y no «transform», que ya usan la entrada del hero, el revelado al hacer
    // scroll y la captura que se aplana con el scroll: así se suman en vez de pisarse. La perspectiva la pone el padre.
    if (canHover && !prefersReducedMotion) {
        const inclinar = (el, max, objetivo = el) => {
            let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
            const pintar = () => {
                x += (tx - x) * 0.12;
                y += (ty - y) * 0.12;
                const angulo = Math.hypot(x, y);
                objetivo.style.rotate = angulo < 0.01 ? '' : `${x.toFixed(4)} ${y.toFixed(4)} 0 ${angulo.toFixed(3)}deg`;
                const quieto = Math.abs(tx - x) < 0.01 && Math.abs(ty - y) < 0.01;
                frame = quieto ? 0 : requestAnimationFrame(pintar);
            };
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                tx = (0.5 - (e.clientY - r.top) / r.height) * max;   // giro sobre X: arriba/abajo
                ty = ((e.clientX - r.left) / r.width - 0.5) * max;   // giro sobre Y: izquierda/derecha
                if (!frame) frame = requestAnimationFrame(pintar);
            }, { passive: true });
            el.addEventListener('pointerleave', () => {
                tx = 0; ty = 0;
                if (!frame) frame = requestAnimationFrame(pintar);
            });
        };
        document.querySelectorAll('.path-card').forEach(el => inclinar(el, 9));
        document.querySelectorAll('.work-card, .shot, .video-card').forEach(el => inclinar(el, 6));
        document.querySelectorAll('.plan-card').forEach(el => inclinar(el, 5));
        document.querySelectorAll('.product-shot').forEach(el => inclinar(el, 4));
        document.querySelectorAll('.orbit3d').forEach(el => inclinar(el, 34, el.querySelector('.orbit3d-ring')));
    }

    // --- Borde de luz que sigue al cursor en tarjetas y paneles (solo con ratón) ---
    if (canHover && !prefersReducedMotion) {
        document.querySelectorAll('.path-card, .work-card, .app-tile, .principle, .feature-col, .giro-grid li, .cta-band').forEach(el => {
            el.classList.add('glow-card');
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--gx', `${e.clientX - r.left}px`);
                el.style.setProperty('--gy', `${e.clientY - r.top}px`);
            }, { passive: true });
        });
    }

    // --- Sistema orbital: descripción del elemento que está a la derecha ---
    const orbitRing = document.querySelector('#orbit-ring');
    const orbitCaption = document.querySelector('#orbit-caption');

    if (orbitRing && orbitCaption) {
        const ORBIT_DURATION_MS = 26000; // debe coincidir con la duración de @keyframes orbit-spin en styles.css
        const START_ANGLES = [0, 72, 144, 216, 288]; // grados desde arriba, en sentido horario, uno por .orbit-item-N
        const items = Array.from(orbitRing.querySelectorAll('.orbit-item'));
        const captionTitle = orbitCaption.querySelector('.orbit-caption-title');
        const captionDesc = orbitCaption.querySelector('.orbit-caption-desc');
        const orbitListItems = document.querySelectorAll('#orbit-list li');

        const angularDistance = (a, b) => {
            const diff = Math.abs(a - b) % 360;
            return diff > 180 ? 360 - diff : diff;
        };

        const closestToRightIndex = (rotationDeg) => {
            let bestIndex = 0;
            let bestDistance = Infinity;
            START_ANGLES.forEach((start, i) => {
                const distance = angularDistance((start + rotationDeg) % 360, 90);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = i;
                }
            });
            return bestIndex;
        };

        const setActiveItem = (index, immediate) => {
            items.forEach((item, i) => item.classList.toggle('is-active', i === index));
            orbitListItems.forEach((li, i) => li.classList.toggle('is-active', i === index));
            const active = items[index];

            const applyText = () => {
                captionTitle.textContent = active.dataset.title;
                captionDesc.textContent = active.dataset.desc;
                orbitCaption.classList.add('is-visible');
            };

            if (immediate) {
                applyText();
                return;
            }

            orbitCaption.classList.remove('is-visible');
            window.setTimeout(applyText, 180);
        };

        let lastIndex = null;
        const startTime = performance.now();

        const tick = () => {
            const rotationDeg = prefersReducedMotion
                ? 0
                : (((performance.now() - startTime) / ORBIT_DURATION_MS) * 360) % 360;
            const index = closestToRightIndex(rotationDeg);
            if (index !== lastIndex) {
                setActiveItem(index, lastIndex === null);
                lastIndex = index;
            }
        };

        tick();
        if (!prefersReducedMotion) {
            window.setInterval(tick, 200);
        }
    }

    if (canHover) {
        // Brillo que sigue al cursor sobre las tarjetas de vidrio
        const spotlightEls = document.querySelectorAll(
            '.service-card, .stat, .tech-panel, .blog-card, .video-card'
        );
        spotlightEls.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                el.style.setProperty('--mx', `${x}%`);
                el.style.setProperty('--my', `${y}%`);
            });
        });

        if (!prefersReducedMotion) {
            // Inclinación 3D en las tarjetas destacadas: sigue al ratón suavizada fotograma a fotograma (la transición
            // CSS de transform iría siempre por detrás); al salir vuelve con la transición normal
            const tiltEls = document.querySelectorAll('.service-card, .tech-panel');
            tiltEls.forEach(el => {
                let target = { rx: 0, ry: 0, lift: 0 }, now = { rx: 0, ry: 0, lift: 0 }, frame = 0;
                const paint = () => {
                    for (const k in now) now[k] += (target[k] - now[k]) * 0.2;
                    el.style.transform = `perspective(800px) rotateX(${now.rx}deg) rotateY(${now.ry}deg) translateY(${now.lift}px)`;
                    const settled = Object.keys(now).every(k => Math.abs(target[k] - now[k]) < 0.01);
                    frame = settled ? 0 : requestAnimationFrame(paint);
                };
                el.addEventListener('mouseenter', () => {
                    el.style.transitionProperty = 'background-color, box-shadow, scale';
                });
                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width;
                    const py = (e.clientY - rect.top) / rect.height;
                    target = { rx: (0.5 - py) * 8, ry: (px - 0.5) * 8, lift: -6 };
                    if (!frame) frame = requestAnimationFrame(paint);
                });
                el.addEventListener('mouseleave', () => {
                    cancelAnimationFrame(frame);
                    frame = 0;
                    target = { rx: 0, ry: 0, lift: 0 };
                    now = { rx: 0, ry: 0, lift: 0 };
                    el.style.transitionProperty = '';
                    el.style.transform = '';
                });
            });

            // El fondo líquido sigue al cursor con retraso suave (interpolado por fotograma; directo se nota mecánico)
            const liquidBg = document.querySelector('.liquid-bg');
            if (liquidBg) {
                let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
                const follow = () => {
                    x += (tx - x) * 0.08;
                    y += (ty - y) * 0.08;
                    liquidBg.style.transform = `translate(${x}px, ${y}px)`;
                    frame = Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1 ? 0 : requestAnimationFrame(follow);
                };
                window.addEventListener('mousemove', (e) => {
                    tx = (e.clientX / window.innerWidth - 0.5) * 40;
                    ty = (e.clientY / window.innerHeight - 0.5) * 40;
                    if (!frame) frame = requestAnimationFrame(follow);
                }, { passive: true });
            }
        }
    }

    // --- Parallax del hero estático al hacer scroll (no aplica al hero
    // cinematográfico de Restaurants, que ya tiene su propio scroll-scrubbing) ---
    const staticHero = document.querySelector('.hero:not(.hero-pin)');
    if (staticHero && !prefersReducedMotion) {
        const heroBg = staticHero.querySelector('.hero-overlay');
        const heroTextBlock = staticHero.querySelector('.hero-content');

        const updateHeroParallax = () => {
            const rect = staticHero.getBoundingClientRect();
            const progress = Math.min(Math.max(-rect.top / (rect.height || 1), 0), 1);
            if (heroBg) heroBg.style.transform = `translateY(${progress * 60}px)`;
            if (heroTextBlock) {
                heroTextBlock.style.opacity = String(1 - progress * 0.7);
                heroTextBlock.style.transform = `translateY(${progress * 30}px)`;
            }
        };

        window.addEventListener('scroll', updateHeroParallax, { passive: true });
        updateHeroParallax();
    }

    // --- Precarga inteligente de enlaces internos para View Transitions instantáneas ---
    const internalLinks = document.querySelectorAll('a[href$=".html"], a[href^="./"], a[href^="../"], a[href*="/"]');
    const prefetchedUrls = new Set();

    const prefetchUrl = (url) => {
        if (!url || prefetchedUrls.has(url) || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) return;
        try {
            const resolved = new URL(url, window.location.href);
            if (resolved.origin !== window.location.origin) return;
            if (resolved.pathname === window.location.pathname) return;
            prefetchedUrls.add(url);
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resolved.href;
            document.head.appendChild(link);
        } catch (_) {}
    };

    internalLinks.forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#')) {
            a.addEventListener('mouseenter', () => prefetchUrl(href), { passive: true, once: true });
            a.addEventListener('touchstart', () => prefetchUrl(href), { passive: true, once: true });
            a.addEventListener('focus', () => prefetchUrl(href), { passive: true, once: true });
        }
    });

    // --- Manifiesto: cada palabra se ilumina según el scroll (--p: su posición de 0 a 1; el CSS hace el resto) ---
    document.querySelectorAll('.manifesto-text').forEach(el => {
        const palabras = el.textContent.trim().split(/\s+/);
        el.setAttribute('aria-label', el.textContent.trim());
        el.textContent = '';
        palabras.forEach((p, i) => {
            const w = document.createElement('span');
            w.className = 'mw';
            w.setAttribute('aria-hidden', 'true');
            w.style.setProperty('--p', (i / palabras.length).toFixed(3));
            w.textContent = p;
            el.append(w, ' ');
        });
    });

    // --- Plataformas apiladas: la tarjeta cubierta por la siguiente se encoge y se oscurece ---
    const apiladas = [...document.querySelectorAll('.work-grid .work-card')];
    const pilaActiva = window.matchMedia('(min-width: 961px)');
    if (apiladas.length && !prefersReducedMotion) {
        const sombras = apiladas.map(c => { const s = document.createElement('span'); s.className = 'stack-shade'; c.append(s); return s; });
        let pendiente = false;
        const actualizar = () => {
            pendiente = false;
            apiladas.forEach((c, i) => {
                const sig = apiladas[i + 1];
                let k = 0;
                if (sig && pilaActiva.matches) {
                    const a = c.getBoundingClientRect(), b = sig.getBoundingClientRect();
                    k = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
                }
                c.style.scale = k ? (1 - k * 0.05).toFixed(4) : '';
                sombras[i].style.opacity = (k * 0.55).toFixed(3);
            });
        };
        window.addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); } }, { passive: true });
        pilaActiva.addEventListener('change', actualizar);
    }

    // --- Botones principales magnéticos: se acercan un poco al cursor (propiedad translate, se suma al hover) ---
    if (canHover && !prefersReducedMotion) {
        document.querySelectorAll('.m3-btn-filled, .btn-primary').forEach(b => {
            let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
            const mover = () => {
                x += (tx - x) * 0.18;
                y += (ty - y) * 0.18;
                b.style.translate = Math.abs(x) + Math.abs(y) < 0.05 && !tx && !ty ? '' : `${x.toFixed(2)}px ${y.toFixed(2)}px`;
                frame = Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05 ? 0 : requestAnimationFrame(mover);
            };
            b.addEventListener('pointermove', (e) => {
                const r = b.getBoundingClientRect();
                tx = ((e.clientX - r.left) / r.width - 0.5) * 10;
                ty = ((e.clientY - r.top) / r.height - 0.5) * 8;
                if (!frame) frame = requestAnimationFrame(mover);
            }, { passive: true });
            b.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!frame) frame = requestAnimationFrame(mover); });
        });
    }

    // --- Buscador (Ctrl/⌘ K): se abre al instante, sin animación, porque es una acción de teclado ---
    const scriptTag = document.querySelector('script[src*="scripts.js"]');
    const base = scriptTag ? scriptTag.getAttribute('src').replace(/script\/scripts\.js.*$/, '') : '';
    const DESCARGA = 'https://activation.ollin-tep.com/descargar';
    const ENTRADAS = [
        ['Descargar CroHub', 'Lanzador de la suite', DESCARGA, 'fa-download'],
        ['Suite CroHub', 'Las nueve apps', base + 'index.html#suite', 'fa-cubes'],
        ['Crovite PDF', 'Documentos PDF', base + 'index.html#suite', 'fa-file-pdf'],
        ['Croma Studio', 'Fotos y montajes', base + 'index.html#suite', 'fa-image'],
        ['Cronmy', 'Fotos y color', base + 'index.html#suite', 'fa-palette'],
        ['Crovect Studio', 'Diseño vectorial', base + 'index.html#suite', 'fa-bezier-curve'],
        ['Cromofi', 'Video', base + 'index.html#suite', 'fa-film'],
        ['Croudio', 'Audio', base + 'index.html#suite', 'fa-microphone'],
        ['CroBeat', 'Música', base + 'index.html#suite', 'fa-drum'],
        ['CroGroove', 'Música y DJ', base + 'index.html#suite', 'fa-compact-disc'],
        ['CroGuard', 'VPN y seguridad', base + 'index.html#suite', 'fa-shield-halved'],
        ['Centzontle', 'Punto de venta multigiro', base + 'centzontle/index.html', 'fa-cash-register'],
        ['ActaPro', 'Actas y trámites', base + 'actapro/index.html', 'fa-file-signature'],
        ['Agro-Cria Pro', 'Agricultura y ganadería', base + 'agrocria/index.html', 'fa-seedling'],
        ['Diagmind', 'Diagnóstico Android', base + 'diagmind/index.html', 'fa-mobile-screen-button'],
        ['Software a medida', 'Plataformas y consultoría', base + 'index.html#a-medida', 'fa-laptop-code'],
        ['Cómo trabajamos', 'Principios y cifras', base + 'index.html#principios', 'fa-pen-ruler'],
        ['Contacto', 'Correo y teléfono', base + 'index.html#contacto', 'fa-envelope'],
    ];
    const navUlBuscar = document.querySelector('.nav-links');
    if (navUlBuscar) {
        const sinAcentos = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const esMac = /Mac|iPhone|iPad/.test(navigator.platform);
        const dlg = document.createElement('dialog');
        dlg.className = 'cmdk';
        dlg.setAttribute('aria-label', 'Buscar en el sitio');
        dlg.innerHTML = `<div class="cmdk-box">
            <div class="cmdk-input"><i class="fas fa-magnifying-glass" aria-hidden="true"></i>
                <input type="text" placeholder="Busca una app, una plataforma o una sección" aria-label="Buscar" role="combobox" aria-expanded="true" aria-controls="cmdk-lista" autocomplete="off" spellcheck="false">
                <kbd>Esc</kbd></div>
            <ul class="cmdk-lista" id="cmdk-lista" role="listbox"></ul>
            <p class="cmdk-vacio" hidden>Sin resultados.</p>
        </div>`;
        document.body.append(dlg);
        const input = dlg.querySelector('input'), lista = dlg.querySelector('ul'), vacio = dlg.querySelector('.cmdk-vacio');
        let visibles = [], sel = 0;
        const pintar = () => {
            const q = sinAcentos(input.value.trim());
            visibles = ENTRADAS.filter(e => !q || sinAcentos(e[0] + ' ' + e[1]).includes(q));
            sel = Math.min(sel, Math.max(0, visibles.length - 1));
            lista.innerHTML = '';
            visibles.forEach((e, i) => {
                const li = document.createElement('li');
                li.id = 'cmdk-op-' + i;
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', String(i === sel));
                li.innerHTML = `<i class="fas ${e[3]}" aria-hidden="true"></i><span class="cmdk-t"></span><span class="cmdk-s"></span>`;
                li.querySelector('.cmdk-t').textContent = e[0];
                li.querySelector('.cmdk-s').textContent = e[1];
                li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; marcar(); } });
                li.addEventListener('click', () => ir(e));
                lista.append(li);
            });
            vacio.hidden = visibles.length > 0;
            marcar();
        };
        const marcar = () => {
            [...lista.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
            input.setAttribute('aria-activedescendant', visibles.length ? 'cmdk-op-' + sel : '');
            lista.children[sel]?.scrollIntoView({ block: 'nearest' });
        };
        const ir = (e) => { dlg.close(); window.location.href = e[2]; };
        const abrir = () => { input.value = ''; sel = 0; pintar(); dlg.showModal(); input.focus(); };
        input.addEventListener('input', () => { sel = 0; pintar(); });
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowDown') { ev.preventDefault(); sel = (sel + 1) % (visibles.length || 1); marcar(); }
            else if (ev.key === 'ArrowUp') { ev.preventDefault(); sel = (sel - 1 + visibles.length) % (visibles.length || 1); marcar(); }
            else if (ev.key === 'Enter' && visibles[sel]) { ev.preventDefault(); ir(visibles[sel]); }
        });
        dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
        document.addEventListener('keydown', (ev) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); dlg.open ? dlg.close() : abrir(); }
        });
        const li = document.createElement('li');
        li.className = 'nav-buscar';
        li.innerHTML = `<button type="button" class="cmdk-btn" aria-label="Buscar en el sitio" title="Buscar (${esMac ? '⌘' : 'Ctrl'} K)"><i class="fas fa-magnifying-glass" aria-hidden="true"></i><span class="cmdk-btn-txt">Buscar</span></button>`;
        li.querySelector('button').addEventListener('click', () => { if (navUlBuscar.classList.contains('active')) mobileMenu?.click(); abrir(); });
        navUlBuscar.append(li);
    }

    // --- Luz ambiental: el fondo cambia de color según la sección (fundido de opacidad, sin repintar) ---
    const seccionesAmbiente = document.querySelectorAll('[data-ambiente]');
    const fondoAmbiente = document.querySelector('.liquid-bg');
    if (seccionesAmbiente.length && fondoAmbiente) {
        const capas = {};
        ['naranja', 'azul', 'violeta'].forEach(c => {
            const s = document.createElement('span');
            s.className = 'ambiente ambiente-' + c;
            fondoAmbiente.append(s);
            capas[c] = s;
        });
        const ambienteObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) Object.entries(capas).forEach(([c, s]) => s.classList.toggle('is-on', c === e.target.dataset.ambiente));
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        seccionesAmbiente.forEach(s => ambienteObserver.observe(s));
        // al volver arriba (fuera de toda sección con color) se apaga
        const inicioHero = document.querySelector('.hero');
        if (inicioHero) new IntersectionObserver(([e]) => {
            if (e.isIntersecting) Object.values(capas).forEach(s => s.classList.remove('is-on'));
        }, { rootMargin: '-45% 0px -45% 0px' }).observe(inicioHero);
    }

    // --- Cinta: avanza sola y acelera (o invierte) con la velocidad del scroll; solo corre mientras se ve ---
    const cinta = document.querySelector('.cinta');
    if (cinta && !prefersReducedMotion) {
        const pista = cinta.querySelector('.cinta-pista');
        let x = 0, v = 0, ultimoY = window.scrollY, marco = 0, anchoGrupo = 0;
        const medir = () => { anchoGrupo = pista.firstElementChild.offsetWidth; };
        const paso = () => {
            const y = window.scrollY, dy = y - ultimoY;
            ultimoY = y;
            v += (dy * 0.35 - v) * 0.1;                        // velocidad suavizada del scroll
            const avance = 0.7 + v;                            // 0.7 px por fotograma en reposo; subir la invierte
            x = (x - avance) % anchoGrupo;
            if (x > 0) x -= anchoGrupo;
            const sesgo = Math.max(-8, Math.min(8, v * 0.45));
            pista.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) skewX(${(-sesgo).toFixed(2)}deg)`;
            marco = requestAnimationFrame(paso);
        };
        new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !marco) { medir(); ultimoY = window.scrollY; marco = requestAnimationFrame(paso); }
            else if (!e.isIntersecting && marco) { cancelAnimationFrame(marco); marco = 0; }
        }).observe(cinta);
        window.addEventListener('resize', medir, { passive: true });
    }

    // --- Luz que sigue al cursor por toda la página (solo con ratón; se para cuando llega) ---
    if (canHover && !prefersReducedMotion) {
        const luz = document.createElement('div');
        luz.className = 'cursor-luz';
        luz.setAttribute('aria-hidden', 'true');
        document.body.append(luz);
        let tx = 0, ty = 0, lx = 0, ly = 0, marco = 0, primera = true;
        const seguir = () => {
            lx += (tx - lx) * 0.1;
            ly += (ty - ly) * 0.1;
            luz.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
            marco = Math.abs(tx - lx) + Math.abs(ty - ly) < 0.3 ? 0 : requestAnimationFrame(seguir);
        };
        window.addEventListener('pointermove', (e) => {
            tx = e.clientX; ty = e.clientY;
            if (primera) { primera = false; lx = tx; ly = ty; luz.classList.add('is-on'); }
            if (!marco) marco = requestAnimationFrame(seguir);
        }, { passive: true });
        document.documentElement.addEventListener('pointerleave', () => luz.classList.remove('is-on'));
        document.documentElement.addEventListener('pointerenter', () => luz.classList.add('is-on'));
    }

    // --- Títulos de sección: las palabras suben desde una máscara (las dispara la clase is-visible de la aparición) ---
    if (!prefersReducedMotion) {
        document.querySelectorAll('.block-title, .section-title').forEach(h => {
            const palabras = h.textContent.trim().split(/\s+/);
            h.setAttribute('aria-label', h.textContent.trim().replace(/\s+/g, ' '));
            h.textContent = '';
            palabras.forEach((p, i) => {
                const caja = document.createElement('span');
                caja.className = 'tw';
                caja.setAttribute('aria-hidden', 'true');
                const dentro = document.createElement('span');
                dentro.className = 'twi';
                dentro.style.setProperty('--i', i);
                dentro.textContent = p;
                caja.append(dentro);
                h.append(caja, ' ');
            });
        });
    }

    // --- Borde de luz giratorio en lo destacado (plan recomendado y banda de contacto) ---
    if (!prefersReducedMotion) {
        document.querySelectorAll('.plan-featured, .cta-band').forEach(el => {
            el.insertAdjacentHTML('afterbegin', '<span class="ring-luz" aria-hidden="true"><span></span></span>');
        });
    }

    // --- Centzontle: la palabra rueda entre los giros; se para si no se ve o la pestaña está oculta ---
    const palabraGiro = document.querySelector('.giro-palabra');
    if (palabraGiro && !prefersReducedMotion) {
        const GIROS = ['restaurante', 'farmacia', 'boutique', 'minisúper', 'cafetería', 'ferretería', 'barbería', 'taller', 'papelería', 'carnicería', 'bar'];
        let n = 0, visible = false;
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(palabraGiro);
        setInterval(() => {
            if (!visible || document.hidden) return;
            n = (n + 1) % GIROS.length;
            palabraGiro.classList.add('sale');
            setTimeout(() => {
                palabraGiro.textContent = GIROS[n];
                palabraGiro.classList.remove('sale');
                palabraGiro.classList.add('entra');
                requestAnimationFrame(() => requestAnimationFrame(() => palabraGiro.classList.remove('entra')));
            }, 220);
        }, 2000);
    }
});