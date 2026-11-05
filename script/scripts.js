// --- Modo ligero: en equipos modestos se apagan los efectos caros (estrellas, aurora, luz del cursor) ---
// Se decide por el hardware al cargar y, después, midiendo los fotogramas reales una vez pasada la entrada del hero
(() => {
    const raiz = document.documentElement;
    const red = navigator.connection;
    if (navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2 || red?.saveData || /2g/.test(red?.effectiveType || '')) raiz.classList.add('ligero');
    navigator.getBattery?.().then(b => { if (!b.charging && b.level < 0.2) raiz.classList.add('ligero'); }).catch(() => {});
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || raiz.classList.contains('ligero')) return;
    setTimeout(() => {
        if (document.hidden) return;
        let fotogramas = 0;
        const t0 = performance.now();
        const contar = (ahora) => {
            fotogramas++;
            if (ahora - t0 < 2000) { requestAnimationFrame(contar); return; }
            const fps = fotogramas * 1000 / (ahora - t0);
            raiz.dataset.fps = Math.round(fps);
            if (fps < 35 && !document.hidden) raiz.classList.add('ligero');
        };
        requestAnimationFrame(contar);
    }, 3000);
})();

// --- Transición entre páginas: la captura de la plataforma vuela hasta la captura grande de su página, y al revés ---
// Fuera de DOMContentLoaded porque pagereveal llega antes del primer pintado. El nombre solo se pone si la captura se ve:
// si estuviera fuera de pantalla, entraría volando desde lejos.
(() => {
    const seVe = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
    window.addEventListener('pagereveal', (e) => {
        if (!e.viewTransition || !window.navigation?.activation?.from?.url) return;
        const m = window.navigation.activation.from.url.match(/\/(centzontle|actapro|agrocria|diagmind)\//);
        const card = m && document.querySelector(`[data-vt="shot-${m[1]}"] .work-shot`);
        if (card && seVe(card)) {
            card.style.viewTransitionName = 'shot-' + m[1];
            e.viewTransition.finished.finally(() => { card.style.viewTransitionName = ''; });
        }
    });
    window.addEventListener('pageswap', () => {
        const hero = document.querySelector('.product-shot');
        if (hero && !seVe(hero)) hero.style.viewTransitionName = 'none';
    });
    document.addEventListener('click', (e) => {
        const a = e.target.closest?.('[data-vt]');
        if (a) a.querySelector('.work-shot').style.viewTransitionName = a.dataset.vt;
    });
})();

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
    // --- Idioma de la página: los textos que crea este archivo salen en el idioma del documento ---
    const EN = document.documentElement.lang === 'en';
    const T = (es, en) => (EN ? en : es);

    // --- Dispositivo: sistema del visitante; los botones de descarga le hablan a su sistema ---
    const ua = navigator.userAgent;
    const sistema = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios'
        : /Android/.test(ua) ? 'android' : /Windows/.test(ua) ? 'windows' : /Macintosh|Mac OS X/.test(ua) ? 'mac'
        : /CrOS/.test(ua) ? 'otro' : /Linux|X11/.test(ua) ? 'linux' : 'otro';
    const esMovil = sistema === 'ios' || sistema === 'android';
    document.documentElement.dataset.so = sistema;
    document.documentElement.classList.toggle('dev-movil', esMovil);
    const SISTEMAS = {
        windows: ['Windows', 'fa-windows', T('También para macOS y Linux', 'Also for macOS and Linux')],
        mac: ['Mac', 'fa-apple', T('También para Windows y Linux', 'Also for Windows and Linux')],
        linux: [T('Linux (.deb)', 'Linux (.deb)'), 'fa-linux', T('También para Windows y macOS', 'Also for Windows and macOS')],
    };
    document.querySelectorAll('a.m3-btn[href*="activation.ollin-tep.com/descargar"]').forEach(a => {
        const enCabecera = !!a.closest('.nav-cta');
        const ponerNota = (texto) => {
            if (enCabecera) return;
            const p = document.createElement('p');
            p.className = 'so-nota';
            p.textContent = texto;
            (a.closest('.path-actions') || a).after(p);
        };
        if (esMovil) {
            // CroHub es para computadora: desde el móvil lo útil es mandarse el enlace
            const pintar = (texto, icono) => { a.innerHTML = `${texto} <i class="fas ${icono} text-xs" aria-hidden="true"></i>`; };
            pintar(T('Enviar a mi computadora', 'Send to my computer'), 'fa-paper-plane');
            ponerNota(T('CroHub es para computadora: Windows, macOS y Linux.', 'CroHub is for computers: Windows, macOS and Linux.'));
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                const url = a.href;
                try {
                    if (navigator.share) { await navigator.share({ title: 'CroHub', url }); return; }
                    await navigator.clipboard.writeText(url);
                    pintar(T('Enlace copiado', 'Link copied'), 'fa-check');
                } catch (err) {
                    if (err?.name !== 'AbortError') window.location.href = url;
                }
            });
        } else if (SISTEMAS[sistema]) {
            const [nombre, icono, otros] = SISTEMAS[sistema];
            a.innerHTML = enCabecera
                ? `<i class="fab ${icono}" aria-hidden="true"></i> ${a.textContent.trim()}`
                : `${T('Descargar para', 'Download for')} ${nombre} <i class="fab ${icono}" aria-hidden="true"></i>`;
            ponerNota(otros);
        }
    });

    
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

    // Riel lateral: un punto por sección (solo en pantallas anchas, lo oculta el CSS)
    const puntosRiel = new Map();
    if (trackedSections.length > 1) {
        const riel = document.createElement('nav');
        riel.className = 'riel';
        riel.setAttribute('aria-label', T('Secciones de la página', 'Page sections'));
        trackedSections.forEach(s => {
            const a = document.createElement('a');
            a.href = '#' + s.id;
            a.setAttribute('aria-label', anchorById.get(s.id).textContent.trim());
            a.dataset.nombre = anchorById.get(s.id).textContent.trim();
            riel.append(a);
            puntosRiel.set(s.id, a);
        });
        document.body.append(riel);
    }

    if (trackedSections.length) {
        const inBand = new Set();
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => entry.isIntersecting ? inBand.add(entry.target) : inBand.delete(entry.target));
            const current = trackedSections.find(s => inBand.has(s));
            if (!current) return; // entre secciones: se queda la última activa
            navAnchors.forEach(a => a.classList.toggle('active', a === anchorById.get(current.id)));
            puntosRiel.forEach((p, id) => p.classList.toggle('is-on', id === current.id));
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
        document.querySelectorAll('.work-card').forEach(el => inclinar(el, 6));
        document.querySelectorAll('.app-tile, .principle').forEach(el => inclinar(el, 8));
        document.querySelectorAll('.cta-band').forEach(el => inclinar(el, 3));
        if (!window.matchMedia('(min-width: 961px)').matches) document.querySelectorAll('.shot, .video-card').forEach(el => inclinar(el, 6));
        document.querySelectorAll('.hero-home').forEach(el => {
            const texto = el.querySelector('.hero-content');
            if (texto) inclinar(el, 5, texto);
            const logo = el.querySelector('.logo3d-mano');
            if (logo) inclinar(el, 46, logo);
        });
        document.querySelectorAll('.plan-card').forEach(el => inclinar(el, 5));
        document.querySelectorAll('.product-shot').forEach(el => inclinar(el, 4));
        document.querySelectorAll('.orbit3d').forEach(el => inclinar(el, 34, el.querySelector('.orbit3d-ring')));
    }

    // --- Borde de luz que sigue al cursor en tarjetas y paneles (solo con ratón) ---
    if (canHover && !prefersReducedMotion) {
        document.querySelectorAll('.path-card, .work-card, .app-tile, .principle, .feature-col, .giro-grid li, .cta-band, .product-shot, .shot').forEach(el => {
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
    const DESCARGA = 'https://activation.ollin-tep.com/descargar' + T('', '?lang=en');
    const raizIdioma = base + (EN ? 'en/' : '');
    const ENTRADAS = [
        [T('Descargar CroHub', 'Download CroHub'), T('Lanzador de la suite', 'The suite launcher'), DESCARGA, 'fa-download'],
        [T('Suite CroHub', 'CroHub suite'), T('Las nueve apps', 'The nine apps'), raizIdioma + 'index.html#suite', 'fa-cubes'],
        ['Crovite PDF', T('Documentos PDF', 'PDF documents'), raizIdioma + 'index.html#suite', 'fa-file-pdf'],
        ['Croma Studio', T('Fotos y montajes', 'Photos and montages'), raizIdioma + 'index.html#suite', 'fa-image'],
        ['Cronmy', T('Fotos y color', 'Photos and color'), raizIdioma + 'index.html#suite', 'fa-palette'],
        ['Crovect Studio', T('Diseño vectorial', 'Vector design'), raizIdioma + 'index.html#suite', 'fa-bezier-curve'],
        ['Cromofi', 'Video', raizIdioma + 'index.html#suite', 'fa-film'],
        ['Croudio', 'Audio', raizIdioma + 'index.html#suite', 'fa-microphone'],
        ['CroBeat', T('Música', 'Music'), raizIdioma + 'index.html#suite', 'fa-drum'],
        ['CroGroove', T('Música y DJ', 'Music and DJ'), raizIdioma + 'index.html#suite', 'fa-compact-disc'],
        ['CroGuard', T('VPN y seguridad', 'VPN and security'), raizIdioma + 'index.html#suite', 'fa-shield-halved'],
        ['Centzontle', T('Punto de venta multigiro', 'Point of sale for any business'), raizIdioma + 'centzontle/index.html', 'fa-cash-register'],
        ['ActaPro', T('Actas y trámites', 'Minutes and procedures'), raizIdioma + 'actapro/index.html', 'fa-file-signature'],
        ['Agro-Cria Pro', T('Agricultura y ganadería', 'Farming and livestock'), raizIdioma + 'agrocria/index.html', 'fa-seedling'],
        ['Diagmind', T('Diagnóstico Android', 'Android diagnostics'), raizIdioma + 'diagmind/index.html', 'fa-mobile-screen-button'],
        [T('Software a medida', 'Custom software'), T('Plataformas y consultoría', 'Platforms and consulting'), raizIdioma + 'index.html#a-medida', 'fa-laptop-code'],
        [T('Cómo trabajamos', 'How we work'), T('Principios y cifras', 'Principles and numbers'), raizIdioma + 'index.html#principios', 'fa-pen-ruler'],
        [T('Contacto', 'Contact'), T('Correo y teléfono', 'Email and phone'), raizIdioma + 'index.html#contacto', 'fa-envelope'],
    ];
    const navUlBuscar = document.querySelector('.nav-links');
    if (navUlBuscar) {
        const sinAcentos = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const esMac = /Mac|iPhone|iPad/.test(navigator.platform);
        const dlg = document.createElement('dialog');
        dlg.className = 'cmdk';
        dlg.setAttribute('aria-label', T('Buscar en el sitio', 'Search the site'));
        dlg.innerHTML = `<div class="cmdk-box">
            <div class="cmdk-input"><i class="fas fa-magnifying-glass" aria-hidden="true"></i>
                <input type="text" placeholder="${T('Busca una app, una plataforma o una sección', 'Search for an app, a platform or a section')}" aria-label="${T('Buscar', 'Search')}" role="combobox" aria-expanded="true" aria-controls="cmdk-lista" autocomplete="off" spellcheck="false">
                <kbd>Esc</kbd></div>
            <ul class="cmdk-lista" id="cmdk-lista" role="listbox"></ul>
            <p class="cmdk-vacio" hidden>${T('Sin resultados.', 'No results.')}</p>
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
        li.innerHTML = `<button type="button" class="cmdk-btn" aria-label="${T('Buscar en el sitio', 'Search the site')}" title="${T('Buscar', 'Search')} (${esMac ? '⌘' : 'Ctrl'} K)"><i class="fas fa-magnifying-glass" aria-hidden="true"></i><span class="cmdk-btn-txt">${T('Buscar', 'Search')}</span></button>`;
        li.querySelector('button').addEventListener('click', () => { if (navUlBuscar.classList.contains('active')) mobileMenu?.click(); abrir(); });
        navUlBuscar.append(li);

        // Selector de idioma: guarda la elección para que la detección automática no vuelva a decidir
        const liIdioma = document.createElement('li');
        liIdioma.className = 'nav-idioma';
        const enlaceIdioma = document.createElement('a');
        const ruta = window.location.pathname;
        enlaceIdioma.href = (EN ? ruta.replace(/^\/en(\/|$)/, '/') : '/en' + ruta) + window.location.hash;
        enlaceIdioma.hreflang = EN ? 'es' : 'en';
        enlaceIdioma.lang = EN ? 'es' : 'en';
        enlaceIdioma.textContent = EN ? 'ES' : 'EN';
        enlaceIdioma.setAttribute('aria-label', EN ? 'Ver en español' : 'View in English');
        enlaceIdioma.addEventListener('click', () => { try { localStorage.setItem('ollintep-idioma', EN ? 'es' : 'en'); } catch (e) {} });
        liIdioma.append(enlaceIdioma);
        li.before(liIdioma);
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
        const GIROS = T(['restaurante', 'farmacia', 'boutique', 'minisúper', 'cafetería', 'ferretería', 'barbería', 'taller', 'papelería', 'carnicería', 'bar'], ['restaurant', 'pharmacy', 'boutique', 'grocery store', 'café', 'hardware store', 'barbershop', 'repair shop', 'stationery store', 'butcher shop', 'bar']);
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

    // --- Logo en volumen: copias del logo a distinta profundidad (solo si no se pide reducir movimiento) ---
    const giroLogo = document.querySelector('.logo3d-giro');
    if (giroLogo && !prefersReducedMotion) {
        const original = giroLogo.querySelector('img');
        original.classList.add('logo3d-frente');
        for (let k = 1; k <= 12; k++) {
            const capa = original.cloneNode();
            capa.classList.remove('logo3d-frente');
            capa.classList.add('logo3d-capa');
            capa.style.transform = `translateZ(${-k * 1.6}px)`;
            giroLogo.append(capa);
        }
    }

    // --- Carrusel 3D de capturas (escritorio): la sección se queda fija y un prisma gira con el scroll, con pausa en cada cara ---
    const rejillaCapturas = document.querySelector('.shot-grid, #capturas > .videos-grid, #capturas > .grid');
    if (rejillaCapturas && !prefersReducedMotion) {
        const caras = [...rejillaCapturas.children];
        const media = window.matchMedia('(min-width: 961px)');
        const paso = 360 / caras.length;
        const apotema = 0.5 / Math.tan(Math.PI / caras.length);   // 3 caras: un prisma; 2 caras: una lámina que se voltea
        const medirAlto = () => {
            if (!rotor) return;
            caras.forEach(c => { c.style.bottom = 'auto'; });   // con inset: 0 medirían el alto del rotor, no el suyo
            rotor.style.height = Math.max(...caras.map(c => c.offsetHeight)) + 'px';
            caras.forEach(c => { c.style.bottom = ''; });
        };
        let escena = null, rotor = null, puntos = [], actual = 0, objetivo = 0, marco = 0;
        const suave = f => f * f * (3 - 2 * f);
        const leerScroll = () => {
            const r = rejillaCapturas.getBoundingClientRect();
            const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
            const t = p * (caras.length - 1);
            const i = Math.min(caras.length - 2, Math.floor(t));
            objetivo = -(i + suave(Math.min(1, Math.max(0, (t - i - 0.15) / 0.7)))) * paso;
            const cara = Math.round(-objetivo / paso);
            puntos.forEach((d, k) => d.classList.toggle('is-on', k === cara));
            if (!marco) marco = requestAnimationFrame(girar);
        };
        const girar = () => {
            actual += (objetivo - actual) * 0.12;
            rotor.style.transform = `translateZ(calc(var(--R) * -1)) rotateY(${actual.toFixed(3)}deg)`;
            marco = Math.abs(objetivo - actual) < 0.02 ? 0 : requestAnimationFrame(girar);
        };
        const montar = () => {
            rejillaCapturas.classList.add('carrusel');
            rejillaCapturas.style.height = caras.length * 100 + 'vh';
            escena = document.createElement('div');
            escena.className = 'carrusel-escena';
            escena.style.setProperty('--k', apotema.toFixed(4));
            rotor = document.createElement('div');
            rotor.className = 'carrusel-rotor';
            caras.forEach((c, k) => {
                c.classList.add('is-visible');
                c.style.transitionDelay = '';
                c.style.transform = `rotateY(${k * paso}deg) translateZ(var(--R))`;
                rotor.append(c);
            });
            const lista = document.createElement('div');
            lista.className = 'carrusel-puntos';
            lista.setAttribute('aria-hidden', 'true');
            puntos = caras.map(() => lista.appendChild(document.createElement('span')));
            escena.append(rotor, lista);
            rejillaCapturas.append(escena);
            medirAlto();
            window.addEventListener('scroll', leerScroll, { passive: true });
            window.addEventListener('resize', medirAlto, { passive: true });
            caras.forEach(c => c.querySelector('img')?.addEventListener('load', medirAlto));
            leerScroll();
        };
        const desmontar = () => {
            window.removeEventListener('scroll', leerScroll);
            window.removeEventListener('resize', medirAlto);
            rejillaCapturas.style.height = '';
            cancelAnimationFrame(marco); marco = 0;
            caras.forEach(c => { c.style.transform = ''; rejillaCapturas.append(c); });
            escena?.remove(); escena = null; rotor = null; puntos = [];
            rejillaCapturas.classList.remove('carrusel');
        };
        if (media.matches) montar();
        media.addEventListener('change', e => (e.matches ? montar() : desmontar()));
    }

    // --- Campo de estrellas en el hero: profundidad real; responde al ratón y al scroll; se para si no se ve ---
    const heroEstrellas = document.querySelector('.hero-home');
    if (heroEstrellas && !prefersReducedMotion) {
        const lienzo = document.createElement('canvas');
        lienzo.className = 'estrellas';
        lienzo.setAttribute('aria-hidden', 'true');
        heroEstrellas.prepend(lienzo);
        const ctx = lienzo.getContext('2d');
        const color = getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-primary').trim() || '#6ea2ff';
        let W = 0, H = 0, estrellas = [], marco = 0, mx = 0, my = 0, ox = 0, oy = 0, ultimoY = window.scrollY, impulso = 0;
        const nueva = (z) => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: z ?? 0.15 + Math.random() * 0.85, clara: Math.random() < 0.7 });
        const ajustar = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            W = heroEstrellas.offsetWidth; H = heroEstrellas.offsetHeight;
            lienzo.width = W * dpr; lienzo.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.min(150, Math.round(W * H / 11000));
            estrellas = Array.from({ length: n }, () => nueva());
        };
        const dibujar = () => {
            if (document.documentElement.classList.contains('ligero')) { marco = 0; return; }
            const y = window.scrollY;
            impulso += (Math.abs(y - ultimoY) * 0.00012 - impulso) * 0.1;
            ultimoY = y;
            ox += (mx - ox) * 0.05; oy += (my - oy) * 0.05;
            ctx.clearRect(0, 0, W, H);
            const avance = 0.0007 + impulso;
            for (const s of estrellas) {
                s.z -= avance;
                if (s.z <= 0.05) Object.assign(s, nueva(1));
                const k = 0.32 / s.z;
                const px = W / 2 + (s.x * W / 2) * k + ox * (1 / s.z) * 8;
                const py = H * 0.42 + (s.y * H / 2) * k + oy * (1 / s.z) * 8;
                if (px < -4 || px > W + 4 || py < -4 || py > H + 4) { if (s.z < 0.5) Object.assign(s, nueva(1)); continue; }
                ctx.globalAlpha = Math.min(0.85, (1 - s.z) * 1.05);
                ctx.fillStyle = s.clara ? '#dfe8ff' : color;
                ctx.beginPath();
                ctx.arc(px, py, Math.min(2.1, 0.45 / s.z * 0.55), 0, 6.283);
                ctx.fill();
            }
            marco = requestAnimationFrame(dibujar);
        };
        ajustar();
        new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !marco) { ultimoY = window.scrollY; marco = requestAnimationFrame(dibujar); }
            else if (!e.isIntersecting && marco) { cancelAnimationFrame(marco); marco = 0; }
        }).observe(heroEstrellas);
        window.addEventListener('resize', ajustar, { passive: true });
        if (canHover) window.addEventListener('pointermove', (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; }, { passive: true });
    }

    // --- El indicador del menú sigue al ratón y vuelve a la sección activa al salir ---
    if (canHover && pildora) {
        navUl.querySelectorAll('a:not(.m3-btn):not(.product-back-btn)').forEach(a => {
            a.addEventListener('pointerenter', () => {
                if (window.innerWidth <= 868) return;
                pildora.style.width = a.offsetWidth + 'px';
                pildora.style.transform = `translateX(${a.offsetLeft}px)`;
                pildora.classList.add('is-on');
            });
        });
        navUl.addEventListener('pointerleave', moverPildora);
    }

    if (canHover && !prefersReducedMotion) {
        // --- Lupa: una lente amplía la captura bajo el cursor, respetando cómo está recortada la imagen ---
        const AUMENTO = 2.2, RADIO = 105;
        document.querySelectorAll('.product-shot img, .work-shot img, .video-thumb img, #capturas .aspect-video img').forEach(img => {
            const caja = img.parentElement;
            const lente = document.createElement('span');
            lente.className = 'lupa';
            lente.setAttribute('aria-hidden', 'true');
            caja.append(lente);
            if (getComputedStyle(caja).position === 'static') caja.style.position = 'relative';
            caja.addEventListener('pointerenter', () => { lente.style.backgroundImage = `url("${img.currentSrc || img.src}")`; lente.classList.add('is-on'); });
            caja.addEventListener('pointerleave', () => lente.classList.remove('is-on'));
            caja.addEventListener('pointermove', (e) => {
                const r = img.getBoundingClientRect(), c = caja.getBoundingClientRect();
                const nw = img.naturalWidth || r.width, nh = img.naturalHeight || r.height;
                const cubre = getComputedStyle(img).objectFit === 'cover' ? Math.max(r.width / nw, r.height / nh) : Math.min(r.width / nw, r.height / nh);
                const ancho = nw * cubre, alto = nh * cubre;
                const [px, py] = getComputedStyle(img).objectPosition.split(' ').map(v => parseFloat(v) / 100);
                const x = e.clientX - r.left - (r.width - ancho) * (isNaN(px) ? 0.5 : px);
                const y = e.clientY - r.top - (r.height - alto) * (isNaN(py) ? 0.5 : py);
                lente.style.translate = `${(e.clientX - c.left - RADIO).toFixed(1)}px ${(e.clientY - c.top - RADIO).toFixed(1)}px`;
                lente.style.backgroundSize = `${(ancho * AUMENTO).toFixed(1)}px ${(alto * AUMENTO).toFixed(1)}px`;
                lente.style.backgroundPosition = `${(RADIO - x * AUMENTO).toFixed(1)}px ${(RADIO - y * AUMENTO).toFixed(1)}px`;
            }, { passive: true });
        });

        // --- La órbita acelera con el ratón encima; cambiar la velocidad no hace saltar la animación ---
        document.querySelectorAll('.orbit3d').forEach(o => {
            const velocidad = v => o.getAnimations({ subtree: true }).forEach(a => a.updatePlaybackRate(v));
            o.addEventListener('pointerenter', () => velocidad(3));
            o.addEventListener('pointerleave', () => velocidad(1));
        });
    }

    // --- Onda desde el punto de clic en los botones ---
    if (!prefersReducedMotion) {
        document.addEventListener('pointerdown', (e) => {
            const b = e.target.closest?.('.m3-btn, .btn');
            if (!b) return;
            const r = b.getBoundingClientRect();
            const d = Math.hypot(r.width, r.height) * 2;
            const onda = document.createElement('span');
            onda.className = 'onda';
            onda.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
            b.append(onda);
            onda.animate([{ transform: 'scale(0)', opacity: 0.35 }, { transform: 'scale(1)', opacity: 0 }], { duration: 550, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).onfinish = () => onda.remove();
        }, { passive: true });
    }
});