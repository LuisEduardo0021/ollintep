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
        pildora.style.translate = `${activo.offsetLeft}px 0`;
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
            if (!current) {
                // entre secciones se queda la última activa; por encima de la primera (el hero) no hay ninguna
                if (trackedSections[0].getBoundingClientRect().top > window.innerHeight * 0.45) {
                    navAnchors.forEach(a => a.classList.remove('active'));
                    puntosRiel.forEach(p => p.classList.remove('is-on'));
                    moverPildora();
                }
                return;
            }
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

    // --- Recorrido: el scroll mueve una cámara entre las capturas; se detiene en cada una para leer ---
    const viaje = document.querySelector('.viaje');
    if (viaje) {
        const pasos = [...viaje.querySelectorAll('.vj-paso')].map(paso => ({ plano: paso.querySelector('.vj-plano'), texto: paso.querySelector('.vj-texto'), nombre: paso.dataset.fondo, fondo: null }));
        const barra = viaje.querySelector('.vj-avance span');
        const ancho = window.matchMedia('(min-width: 961px)');
        const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
        const PROFUNDIDAD = 1100;
        let avance = 0, objetivo = 0, marco = 0, enVista = false, sonando = null;

        // Fondos de video (ambiente, no producto): se crean al acercarse a la sección y solo suena el de la escena actual.
        // Con la lista de móvil, movimiento reducido o modo ligero no se crean ni se descargan.
        const crearFondos = () => {
            if (pasos[0].fondo) return;
            const base = new URL('../resources/video/', document.querySelector('script[src*="scripts.js"]').src);
            const capa = document.createElement('div');
            capa.className = 'vj-fondos';
            capa.setAttribute('aria-hidden', 'true');
            pasos.forEach(paso => {
                const v = document.createElement('video');
                v.muted = true;
                v.loop = true;
                v.playsInline = true;
                v.preload = 'none';
                v.disablePictureInPicture = true;
                v.poster = new URL(`${paso.nombre}.jpg`, base).href;
                v.src = new URL(`${paso.nombre}.mp4`, base).href;
                capa.append(v);
                paso.fondo = v;
            });
            viaje.querySelector('.viaje-fijo').prepend(capa);
        };
        const elegirFondo = (camara) => {
            const actual = pasos[Math.round(camara)]?.fondo;
            const quiere = enVista && viaje.classList.contains('activa') && !document.documentElement.classList.contains('ligero') ? actual : null;
            if (quiere === sonando) return;
            sonando?.pause();
            sonando = quiere;
            if (sonando) {
                sonando.preload = 'auto';
                sonando.play().catch(() => {});
            }
        };

        const pintar = () => {
            const t = avance * (pasos.length - 1);
            const i = Math.floor(t);
            const f = limitar(((t - i) - 0.25) / 0.5);
            const camara = i + f * f * (3 - 2 * f);
            pasos.forEach(({ plano, texto, fondo }, n) => {
                const d = n - camara;
                if (fondo) {
                    fondo.style.opacity = limitar(1 - Math.abs(d) * 1.6);
                    fondo.style.transform = `scale(${1.1 - limitar(d, -1, 1) * 0.08})`;
                }
                const lado = n % 2 ? -1 : 1;
                plano.style.transform = `translate3d(${lado * 15}vw, 0, ${-d * PROFUNDIDAD - 120}px) rotateY(${-lado * (5 + d * 7)}deg)`;
                plano.style.opacity = d < 0 ? limitar(1 + d * 2.5) : limitar(1 - d * 1.4);   // la siguiente captura no se asoma detrás del texto
                texto.style.opacity = limitar(1 - Math.abs(d) * 5);
                texto.style.transform = `translate3d(0, calc(-50% + ${d * 90}px), 0)`;
            });
            barra.style.transform = `scaleX(${avance})`;
            elegirFondo(camara);
        };
        const medir = () => {
            const r = viaje.getBoundingClientRect();
            objetivo = limitar(-r.top / (r.height - window.innerHeight));
        };
        const animar = () => {
            avance += (objetivo - avance) * 0.14;
            if (Math.abs(objetivo - avance) < 0.0004) avance = objetivo;
            pintar();
            marco = avance === objetivo ? 0 : requestAnimationFrame(animar);
        };
        const alMover = () => { medir(); if (!marco) marco = requestAnimationFrame(animar); };
        const ajustar = () => {
            const activa = ancho.matches && !prefersReducedMotion && !document.documentElement.classList.contains('ligero');
            if (activa === viaje.classList.contains('activa')) { if (activa) alMover(); return; }
            viaje.classList.toggle('activa', activa);
            if (activa) {
                if (enVista) crearFondos();
                medir();
                avance = objetivo;
                pintar();
                window.addEventListener('scroll', alMover, { passive: true });
            } else {
                window.removeEventListener('scroll', alMover);
                cancelAnimationFrame(marco);
                marco = 0;
                elegirFondo(0);
                pasos.forEach(({ plano, texto }) => { plano.removeAttribute('style'); texto.removeAttribute('style'); });
            }
        };
        ajustar();
        window.addEventListener('resize', ajustar);
        // El video se carga una pantalla antes de llegar y se detiene al salir de la sección
        new IntersectionObserver(([e]) => {
            enVista = e.isIntersecting;
            if (enVista && viaje.classList.contains('activa')) { crearFondos(); pintar(); }
            else elegirFondo(0);
        }, { rootMargin: '100% 0px' }).observe(viaje);
    }

    // --- Fondos de video de ambiente (data-video): solo en escritorio, se crean al acercarse y suenan solo a la vista.
    // Con móvil, movimiento reducido o modo ligero no se descarga nada. Aparecen con un fundido cuando ya hay imagen.
    const conVideo = [...document.querySelectorAll('[data-video]')];
    if (conVideo.length) {
        const anchoVideo = window.matchMedia('(min-width: 961px)');
        const esLigero = () => document.documentElement.classList.contains('ligero');
        const baseVideo = new URL('../resources/video/', document.querySelector('script[src*="scripts.js"]').src);
        // 100vw incluye la barra de desplazamiento: la capa usa el ancho real para no desbordar
        const medirAncho = () => document.documentElement.style.setProperty('--ancho-util', `${document.documentElement.clientWidth}px`);
        medirAncho();
        window.addEventListener('resize', medirAncho);
        const crearVideo = (seccion) => {
            const capa = document.createElement('div');
            capa.className = 'fondo-video';
            capa.setAttribute('aria-hidden', 'true');
            const v = document.createElement('video');
            v.muted = true;
            v.loop = true;
            v.playsInline = true;
            v.preload = 'auto';
            v.disablePictureInPicture = true;
            v.src = new URL(`${seccion.dataset.video}.mp4`, baseVideo).href;
            v.addEventListener('playing', () => capa.classList.add('listo'), { once: true });
            v.addEventListener('timeupdate', () => { if (esLigero()) v.pause(); });
            capa.append(v);
            seccion.prepend(capa);
            return v;
        };
        const observador = new IntersectionObserver((entradas) => entradas.forEach(({ target, isIntersecting }) => {
            const video = target.querySelector(':scope > .fondo-video video');
            if (isIntersecting && anchoVideo.matches && !prefersReducedMotion && !esLigero()) (video || crearVideo(target)).play().catch(() => {});
            else video?.pause();
        }), { rootMargin: '25% 0px' });
        const observarTodo = () => conVideo.forEach(s => { observador.unobserve(s); observador.observe(s); });
        // Tras la carga, para no competir con el contenido principal de la página
        if (document.readyState === 'complete') observarTodo();
        else window.addEventListener('load', observarTodo, { once: true });
        anchoVideo.addEventListener('change', observarTodo);
    }

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
        [T('Tepic, Nayarit', 'Tepic, Nayarit'), T('Nuestra región, en pixel art', 'Our region, in pixel art'), raizIdioma + 'index.html#nayarit', 'fa-location-dot'],
        [T('Diseño', 'Design'), T('Logos, identidad de marca y publicidad', 'Logos, brand identity and advertising'), raizIdioma + 'index.html#diseno', 'fa-pen-nib'],
        [T('Publicidad', 'Advertising'), T('Anuncios, carteles y lonas', 'Ads, posters and banners'), raizIdioma + 'index.html#diseno', 'fa-bullhorn'],
        [T('Redes e infraestructura', 'Networks and infrastructure'), T('Planos, servidores, VLANs, switches y routers', 'Plans, servers, VLANs, switches and routers'), raizIdioma + 'index.html#redes', 'fa-network-wired'],
        [T('VLANs', 'VLANs'), T('Segmentación de tu red', 'Segmenting your network'), raizIdioma + 'index.html#redes', 'fa-layer-group'],
        [T('Servicio técnico', 'Technical service'), T('Mantenimiento de hardware y firmware', 'Hardware and firmware maintenance'), raizIdioma + 'index.html#servicio-tecnico', 'fa-screwdriver-wrench'],
        [T('Armado de PC', 'PC building'), T('Ensamblado a la medida', 'Custom-built PCs'), raizIdioma + 'index.html#servicio-tecnico', 'fa-desktop'],
        [T('PC y servidores', 'PCs and servers'), T('Mantenimiento', 'Maintenance'), raizIdioma + 'index.html#servicio-tecnico', 'fa-server'],
        [T('Impresoras y photobooths', 'Printers and photobooths'), T('Mantenimiento, también HiTi', 'Maintenance, including HiTi'), raizIdioma + 'index.html#servicio-tecnico', 'fa-print'],
        [T('GrapheneOS en Pixel', 'GrapheneOS on Pixel'), T('Instalación en Google Pixel', 'Installed on Google Pixel'), raizIdioma + 'index.html#servicio-tecnico', 'fa-mobile-screen-button'],
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
        // El título neón queda fuera: la máscara de cada palabra le recortaría el brillo
        document.querySelectorAll('.block-title:not(.neon-texto), .section-title').forEach(h => {
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
                pildora.style.translate = `${a.offsetLeft}px 0`;
                pildora.classList.add('is-on');
            });
        });
        navUl.addEventListener('pointerleave', moverPildora);
        // Al llegar a un botón (descargar, volver, buscar) el indicador suelta el enlace anterior y no se queda atenuado a su lado
        navUl.querySelectorAll('.m3-btn, .product-back-btn, .cmdk-btn').forEach(b => b.addEventListener('pointerenter', moverPildora));
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

    if (!prefersReducedMotion) {
        // --- Antetítulos: las letras se descifran al entrar en pantalla (el ancho se fija para que nada baile) ---
        const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const descifrar = (el) => {
            const nodo = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).pop();
            if (!nodo) return;
            const final = nodo.textContent;
            el.style.minWidth = el.offsetWidth + 'px';
            const t0 = performance.now(), dura = 650;
            const paso = (ahora) => {
                const p = Math.min(1, (ahora - t0) / dura), fijas = Math.floor(p * final.length);
                nodo.textContent = [...final].map((c, i) => (i < fijas || c === ' ' ? c : LETRAS[Math.floor(Math.random() * LETRAS.length)])).join('');
                if (p < 1) requestAnimationFrame(paso); else { nodo.textContent = final; el.style.minWidth = ''; }
            };
            requestAnimationFrame(paso);
        };
        const obsAnte = new IntersectionObserver((entradas) => {
            entradas.forEach(e => { if (e.isIntersecting) { obsAnte.unobserve(e.target); descifrar(e.target); } });
        }, { threshold: 0.6 });
        document.querySelectorAll('.eyebrow').forEach(el => obsAnte.observe(el));

        // --- Precios: el importe cuenta al aparecer; lectores de pantalla y buscadores siguen teniendo el valor real ---
        const obsPrecio = new IntersectionObserver((entradas) => {
            entradas.forEach(e => {
                if (!e.isIntersecting) return;
                obsPrecio.unobserve(e.target);
                const el = e.target, m = el.textContent.match(/^(\D*)([\d,]+)(.*)$/);
                if (!m) return;
                const final = el.textContent, valor = +m[2].replace(/,/g, ''), t0 = performance.now();
                el.setAttribute('aria-label', final);
                const paso = (ahora) => {
                    const p = Math.min(1, (ahora - t0) / 1100), k = 1 - Math.pow(1 - p, 3);
                    el.textContent = p < 1 ? m[1] + Math.round(valor * k).toLocaleString('en-US') + m[3] : final;
                    if (p < 1) requestAnimationFrame(paso);
                };
                requestAnimationFrame(paso);
            });
        }, { threshold: 0.6 });
        document.querySelectorAll('.plan-price-amount').forEach(el => obsPrecio.observe(el));
    }

    // --- La cabecera se aparta al bajar y vuelve al subir (nunca con el menú móvil abierto ni arriba del todo) ---
    if (header && !prefersReducedMotion) {
        let ultimo = window.scrollY, pendiente = false;
        window.addEventListener('scroll', () => {
            if (pendiente) return;
            pendiente = true;
            requestAnimationFrame(() => {
                pendiente = false;
                const y = window.scrollY, d = y - ultimo;
                if (Math.abs(d) < 6) return;
                ultimo = y;
                header.classList.toggle('apartada', d > 0 && y > 500 && !document.querySelector('.nav-links.active'));
            });
        }, { passive: true });
        header.addEventListener('focusin', () => header.classList.remove('apartada'));
    }

    if (canHover && !prefersReducedMotion) {
        // --- La retícula de puntos se enciende alrededor del cursor ---
        const fondo = document.querySelector('.liquid-bg');
        if (fondo) {
            const puntos = document.createElement('span');
            puntos.className = 'puntos-luz';
            fondo.append(puntos);
            let pendiente = false, cx = 0, cy = 0;
            window.addEventListener('pointermove', (e) => {
                cx = e.clientX; cy = e.clientY;
                if (pendiente) return;
                pendiente = true;
                requestAnimationFrame(() => {
                    pendiente = false;
                    const r = puntos.getBoundingClientRect();
                    puntos.style.setProperty('--px', (cx - r.left) + 'px');
                    puntos.style.setProperty('--py', (cy - r.top) + 'px');
                    puntos.style.opacity = 1;
                });
            }, { passive: true });
        }
    }

    if (!prefersReducedMotion) {
        // --- Lo que gira sin fin se pausa cuando no se ve: la GPU descansa y la batería también ---
        const obsPausa = new IntersectionObserver((entradas) => {
            entradas.forEach(e => e.target.classList.toggle('fuera', !e.isIntersecting));
        }, { rootMargin: '120px' });
        document.querySelectorAll('.orbit3d, .ring-luz, .chip3d, .hero, #redes, #principios').forEach(el => obsPausa.observe(el));
    }

    // --- Al señalar el botón de descarga, los iconos de la suite saltan de él (una sola vez por página) ---
    if (canHover && !prefersReducedMotion) {
        const APPS_ICONOS = ['crovite-pdf', 'croma-studio', 'cronmy', 'crovect-studio', 'cromofi', 'croudio', 'crobeat', 'cromix', 'croguard'];
        let yaSalieron = false;
        document.querySelectorAll('a.m3-btn[href*="activation.ollin-tep.com/descargar"]').forEach(boton => {
            if (boton.closest('.nav-cta')) return;
            boton.addEventListener('pointerenter', () => {
                if (yaSalieron || document.documentElement.classList.contains('ligero')) return;
                yaSalieron = true;
                const r = boton.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                APPS_ICONOS.forEach((id, k) => {
                    const img = new Image(40, 40);
                    img.src = base + `resources/suite/${id}-icono.svg`;
                    img.alt = '';
                    img.className = 'icono-salta';
                    img.style.left = (cx - 20) + 'px';
                    img.style.top = (cy - 20) + 'px';
                    document.body.append(img);
                    const a = -Math.PI * (0.12 + 0.76 * k / (APPS_ICONOS.length - 1)), d = 150 + (k % 3) * 45;
                    const x = Math.cos(a) * d, y = Math.sin(a) * d;
                    img.animate([
                        { transform: 'translate3d(0, 0, 0) scale(0.4) rotateY(0deg)', opacity: 0 },
                        { transform: `translate3d(${x * 0.8}px, ${y * 0.8}px, 0) scale(1) rotateY(180deg)`, opacity: 1, offset: 0.45 },
                        { transform: `translate3d(${x}px, ${y + 34}px, 0) scale(0.75) rotateY(360deg)`, opacity: 0 },
                    ], { duration: 1050, delay: k * 28, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }).onfinish = () => img.remove();
                });
            });
        });
    }

    // --- Comparador de ActaPro: la línea se arrastra (es un <input range>, así también funciona con teclado) ---
    document.querySelectorAll('.comparador').forEach(c => {
        const r = c.querySelector('input');
        const poner = v => { c.style.setProperty('--pos', v + '%'); };
        let tocado = false;
        r.addEventListener('input', () => { tocado = true; poner(r.value); });
        r.addEventListener('pointerdown', () => { tocado = true; });
        if (prefersReducedMotion) return;
        // la primera vez que se ve, la línea se mueve sola para enseñar que se puede arrastrar
        const obs = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            obs.disconnect();
            const t0 = performance.now();
            const paso = (a) => {
                if (tocado) return;
                const p = (a - t0) / 1400;
                if (p >= 1) { poner(50); r.value = 50; return; }
                const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
                poner(v.toFixed(1)); r.value = v;
                requestAnimationFrame(paso);
            };
            requestAnimationFrame(paso);
        }, { threshold: 0.5 });
        obs.observe(c);
    });

    // --- Centzontle: elige un giro y la interfaz cambia sus palabras (el vocabulario es el de la app) ---
    const vocDemo = document.querySelector('#voc-demo');
    if (vocDemo) {
        const COMIDA = T({ mesa: 'Mesa', producto: 'Platillo', comanda: 'Comanda', negocio: 'Restaurante', menu: 'Menú' }, { mesa: 'Table', producto: 'Dish', comanda: 'Order', negocio: 'Restaurant', menu: 'Menu' });
        const TIENDA = T({ mesa: 'Cliente', producto: 'Producto', comanda: 'Venta', negocio: 'Negocio', menu: 'Catálogo' }, { mesa: 'Customer', producto: 'Product', comanda: 'Sale', negocio: 'Business', menu: 'Catalog' });
        const VOC = [
            [T('Restaurante', 'Restaurant'), COMIDA],
            ['Bar', { ...COMIDA, negocio: 'Bar' }],
            [T('Cafetería', 'Coffee shop'), { ...COMIDA, mesa: TIENDA.mesa, producto: TIENDA.producto, negocio: T('Cafetería', 'Coffee shop') }],
            [T('Abarrotes', 'Grocery'), { ...TIENDA, negocio: T('Tienda', 'Store') }],
            [T('Carnicería', 'Butcher shop'), TIENDA],
            [T('Farmacia', 'Pharmacy'), { ...TIENDA, negocio: T('Farmacia', 'Pharmacy') }],
            [T('Ferretería', 'Hardware'), { ...TIENDA, negocio: T('Ferretería', 'Hardware store') }],
            [T('Boutique', 'Boutique'), { ...TIENDA, negocio: T('Tienda', 'Store') }],
            [T('Papelería', 'Stationery'), { ...TIENDA, negocio: T('Papelería', 'Stationery store') }],
            [T('Estética', 'Salon'), { ...TIENDA, producto: T('Servicio', 'Service'), negocio: T('Estética', 'Salon') }],
            [T('Taller', 'Repair shop'), { ...TIENDA, producto: T('Servicio', 'Service'), comanda: T('Orden', 'Work order'), negocio: T('Taller', 'Repair shop') }],
            [T('Otro', 'Other'), TIENDA],
        ];
        const pintarPalabras = (v) => vocDemo.querySelectorAll('[data-p]').forEach(el => {
            const nueva = v[el.dataset.p];
            if (el.textContent === nueva) return;
            if (prefersReducedMotion || !el.textContent) { el.textContent = nueva; return; }
            el.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-45%)', filter: 'blur(3px)' }], { duration: 130, easing: 'ease-out' }).onfinish = () => {
                el.textContent = nueva;
                el.animate([{ opacity: 0, transform: 'translateY(45%)', filter: 'blur(3px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
            };
        });
        vocDemo.innerHTML = `<div class="voc-giros" role="group" aria-label="${T('Elige un giro', 'Choose a business type')}"></div>
            <div class="voc-panel" aria-live="polite">
                <div class="voc-cab"><span data-p="negocio"></span><small>Centzontle</small></div>
                <div class="voc-fila"><i class="fas fa-book-open" aria-hidden="true"></i><span data-p="menu"></span></div>
                <div class="voc-fila"><i class="fas fa-magnifying-glass" aria-hidden="true"></i>${T('Buscar', 'Search')} <span class="voc-min" data-p="producto"></span></div>
                <div class="voc-fila"><i class="fas fa-user" aria-hidden="true"></i><span data-p="mesa"></span> 7</div>
                <div class="voc-fila voc-accion"><i class="fas fa-plus" aria-hidden="true"></i>${T('Nueva', 'New')} <span class="voc-min" data-p="comanda"></span></div>
            </div>
            ${EN ? '<p class="voc-nota">Words shown in English for reference; the app itself is in Spanish.</p>' : ''}`;
        const grupo = vocDemo.querySelector('.voc-giros');
        VOC.forEach(([nombre, v], k) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = nombre;
            b.setAttribute('aria-pressed', String(k === 0));
            b.addEventListener('click', () => {
                grupo.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
                pintarPalabras(v);
            });
            grupo.append(b);
        });
        pintarPalabras(VOC[0][1]);
    }

    // --- AgroCría: balance hídrico FAO-56 (Dr = Dr anterior − lluvia − riego + ETc). Valores de ejemplo ---
    const hidrico = document.querySelector('#hidrico');
    if (hidrico) {
        const TAW = 120, RAW = 60, KC = 0.85;
        let dr = 18, dia = 1, et0 = 5, corriendo = !prefersReducedMotion, enPantalla = false;
        const hist = [];
        const bloque = hidrico.querySelector('.hid-bloque');
        const aguas = hidrico.querySelectorAll('.hid-agua');
        const v = n => hidrico.querySelector(`[data-v="${n}"]`);
        const poly = hidrico.querySelector('polyline'), area = hidrico.querySelector('polygon');
        // nueve plantas sobre la tapa; cada una mira a la cámara (rotateY compensa el giro del bloque)
        [-0.3, 0, 0.3].forEach(z => [-0.3, 0, 0.3].forEach(x => {
            const pl = document.createElement('span');
            pl.className = 'hid-planta';
            pl.style.transform = `translate3d(calc(var(--l) * ${x}), calc(var(--h) / -2), calc(var(--l) * ${z})) rotateY(35deg)`;
            pl.innerHTML = '<svg viewBox="0 0 24 40" width="24" height="40"><path d="M12 40V16M12 26C6 25 3 21 3 15c6 0 9 4 9 11ZM12 20c0-7 3-11 9-12 0 7-3 11-9 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
            bloque.append(pl);
        }));
        const pintar = () => {
            const f = (TAW - dr) / TAW;
            aguas.forEach(a => { a.style.transform = `scaleY(${f.toFixed(3)})`; });
            bloque.style.setProperty('--m', Math.max(0, (dr - RAW) / (TAW - RAW)).toFixed(2));
            v('dia').textContent = dia;
            v('agua').textContent = Math.round(f * 100) + ' %';
            v('lamina').textContent = Math.round(dr) + ' mm';
            v('regar').textContent = dr >= 1 ? T(`Regar ${Math.round(dr)} mm`, `Irrigate ${Math.round(dr)} mm`) : T('Suelo a capacidad', 'Soil at capacity');
            hidrico.querySelector('[data-a="regar"]').setAttribute('aria-disabled', String(dr < 1));
            const estado = dr >= TAW ? T('Punto de marchitez: el cultivo ya no puede tomar agua.', 'Wilting point: the crop can no longer take up water.')
                : dr > RAW ? T('Bajo el umbral: toca regar para evitar el estrés hídrico.', 'Below the threshold: irrigate to avoid water stress.')
                : T('Sin estrés: el cultivo toma el agua que necesita.', 'No stress: the crop gets the water it needs.');
            if (v('estado').textContent !== estado) v('estado').textContent = estado;
            v('estado').dataset.nivel = dr >= TAW ? '2' : dr > RAW ? '1' : '0';
            v('etc').textContent = `ETc = ${et0.toFixed(1)} × ${KC} = ${(et0 * KC).toFixed(1)} mm/${T('día', 'day')}`;
            hist.push(f);
            if (hist.length > 40) hist.shift();
            const puntos = hist.map((h, k) => `${(k / 39 * 300).toFixed(1)},${(80 - h * 80).toFixed(1)}`).join(' ');
            poly.setAttribute('points', puntos);
            area.setAttribute('points', hist.length > 1 ? `0,80 ${puntos} ${((hist.length - 1) / 39 * 300).toFixed(1)},80` : '');
        };
        // gotas que caen sobre la tapa; solo decoración, por eso se omiten con movimiento reducido
        const gotas = (n, alto) => {
            if (prefersReducedMotion) return;
            const l = bloque.offsetWidth, h = bloque.offsetHeight;
            for (let k = 0; k < n; k++) {
                const g = document.createElement('span');
                g.className = 'hid-gota';
                const x = (Math.random() - 0.5) * l * 0.85, z = (Math.random() - 0.5) * l * 0.85;
                bloque.append(g);
                g.animate([
                    { transform: `translate3d(${x}px, ${-h / 2 - alto}px, ${z}px) rotateY(35deg)`, opacity: 0 },
                    { opacity: 1, offset: 0.2 },
                    { transform: `translate3d(${x}px, ${-h / 2}px, ${z}px) rotateY(35deg)`, opacity: 0.9 },
                ], { duration: 420 + Math.random() * 180, delay: Math.random() * 450, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'backwards' }).onfinish = () => g.remove();
            }
        };
        hidrico.querySelector('[data-a="regar"]').addEventListener('click', () => { if (dr < 1) return; gotas(22, 70); dr = 0; pintar(); });
        hidrico.querySelector('[data-a="lluvia"]').addEventListener('click', () => { gotas(36, 150); dr = Math.max(0, dr - 15); pintar(); });
        const bPausa = hidrico.querySelector('[data-a="pausa"]');
        const ponerPausa = () => {
            v('pausa').textContent = corriendo ? T('Pausar', 'Pause') : T('Reproducir', 'Play');
            bPausa.querySelector('i').className = `fas ${corriendo ? 'fa-pause' : 'fa-play'} text-xs`;
        };
        bPausa.addEventListener('click', () => { corriendo = !corriendo; ponerPausa(); });
        hidrico.querySelector('input').addEventListener('input', e => { et0 = Number(e.target.value); hist.pop(); pintar(); });
        new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting; }, { threshold: 0.25 }).observe(hidrico);
        setInterval(() => {
            if (!corriendo || !enPantalla || document.hidden || dr >= TAW) return;
            dr = Math.min(TAW, dr + et0 * KC);
            dia++;
            pintar();
        }, 650);
        if (canHover && !prefersReducedMotion) {
            const escena = hidrico.querySelector('.hid-escena');
            escena.addEventListener('pointermove', e => {
                const r = escena.getBoundingClientRect();
                bloque.style.setProperty('--gy', ((e.clientX - r.left) / r.width - 0.5) * 14 + 'deg');
                bloque.style.setProperty('--gx', ((e.clientY - r.top) / r.height - 0.5) * -8 + 'deg');
            });
            escena.addEventListener('pointerleave', () => { bloque.style.removeProperty('--gy'); bloque.style.removeProperty('--gx'); });
        }
        ponerPausa();
        pintar();
    }

    // --- Diagmind: el teléfono se abre por capas al bajar la página; cada botón resalta su capa ---
    const capasDemo = document.querySelector('#capas-demo');
    if (capasDemo) {
        const tel = capasDemo.querySelector('.capas-tel');
        const botones = capasDemo.querySelectorAll('.capas-pasos button');
        const elegir = id => {
            botones.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.capa === id)));
            tel.querySelectorAll('.capa').forEach(c => c.classList.toggle('activa', c.dataset.capa === id));
        };
        botones.forEach(b => b.addEventListener('click', () => elegir(b.dataset.capa)));
        elegir('pantalla');
        if (prefersReducedMotion) {
            tel.style.setProperty('--abre', 1);
        } else {
            let pendiente = false;
            const medir = () => {
                pendiente = false;
                const r = capasDemo.getBoundingClientRect();
                const p = Math.min(1, Math.max(0, (innerHeight * 0.9 - r.top) / (innerHeight * 0.6)));
                tel.style.setProperty('--abre', (1 - (1 - p) ** 3).toFixed(3));
            };
            const alMover = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } };
            new IntersectionObserver(([e]) => {
                window[e.isIntersecting ? 'addEventListener' : 'removeEventListener']('scroll', alMover, { passive: true });
                if (e.isIntersecting) medir();
            }).observe(capasDemo);
        }
    }

    // --- Portada: lanzador simulado. Las apps salen de .app-grid; nada se instala de verdad ---
    const lanzador = document.querySelector('#lanzador');
    if (lanzador) {
        const lista = lanzador.querySelector('.lz-apps');
        const cuenta = lanzador.querySelector('.lz-cuenta');
        const capa = lanzador.querySelector('.lz-abriendo');
        const dos = n => String(n).padStart(2, '0');
        const ESTADOS = { disponible: T('Disponible', 'Available'), bajando: T('Descargando', 'Downloading'), instalando: T('Instalando', 'Installing'), lista: T('Instalada', 'Installed') };
        // Capturas de cada app (resources/screenshots/<app>-<archivo>.webp): al abrirla sale su ventana con ellas; sin capturas, solo el icono
        const CAPTURAS = {
            'crovite-pdf': [
                ['01-portada', T('Todo en una app', 'Every PDF task, one app')],
                ['02-especial', T('Por qué Crovite', 'Why Crovite')],
                ['03-editar', T('Editar', 'Edit')],
                ['04-ia', T('IA privada', 'Private AI')],
                ['05-firmar', T('Firmar', 'Sign')],
                ['06-combinar', T('Combinar', 'Merge')],
                ['07-proteger', T('Proteger', 'Protect')],
                ['08-herramientas', T('Herramientas', 'Tools')],
                ['09-temas', T('Temas', 'Themes')],
                ['10-como-funciona', T('Cómo funciona', 'How it works')],
            ],
        };
        const apps = [...document.querySelectorAll('.app-grid .app-tile')].map(tile => {
            const li = document.createElement('li');
            li.className = 'lz-app';
            li.style.setProperty('--app', tile.style.getPropertyValue('--app'));
            const src = tile.querySelector('img').getAttribute('src'), id = (src.match(/([a-z0-9-]+)-icono\.svg$/) || [])[1];
            li.innerHTML = `<img src="${src}" alt="" width="42" height="42"><div><h3></h3><span class="lz-estado"></span></div><button type="button" class="lz-btn"><span class="lz-relleno"></span><span class="lz-texto"></span></button>`;
            const app = { li, nombre: tile.querySelector('h3').textContent, estado: 'disponible', icono: li.querySelector('img'), btn: li.querySelector('button'), relleno: li.querySelector('.lz-relleno'), texto: li.querySelector('.lz-texto'), marca: li.querySelector('.lz-estado'),
                // la carpeta de recursos, la del icono: resources/ en español, ../resources/ en en/
                capturas: (CAPTURAS[id] || []).map(([archivo, titulo]) => ({ src: src.replace(/suite\/[^/]+$/, `screenshots/${id}-${archivo}.webp`), titulo })) };
            li.querySelector('h3').textContent = app.nombre;
            lista.append(li);
            return app;
        });
        const pintarCuenta = () => {
            const n = apps.filter(a => a.estado === 'lista').length;
            cuenta.textContent = T(`${dos(apps.length)} apps · ${dos(n)} instaladas · ${dos(apps.length - n)} disponibles`, `${dos(apps.length)} apps · ${dos(n)} installed · ${dos(apps.length - n)} available`);
            return n;
        };
        const ponerEstado = (app, estado) => {
            app.estado = estado;
            app.li.dataset.estado = estado;
            app.marca.textContent = ESTADOS[estado];
            if (estado === 'disponible') app.texto.textContent = T('Instalar', 'Install');
            if (estado === 'lista') app.texto.textContent = T('Abrir', 'Open');
            app.btn.setAttribute('aria-label', `${app.texto.textContent} ${app.nombre}`);
        };
        const alTerminar = () => {
            if (pintarCuenta() !== apps.length) return;
            const conFoco = document.activeElement === lanzador.querySelector('[data-a="todas"]');
            lanzador.classList.add('listo');
            if (conFoco) lanzador.querySelector('[data-a="reiniciar"]').focus();
            if (prefersReducedMotion) return;
            // ola de luz por las nueve apps: solo ocurre al completar la suite
            apps.forEach((a, k) => a.icono.animate([{ scale: 1 }, { scale: 1.2, filter: 'brightness(1.25)' }, { scale: 1 }], { duration: 480, delay: k * 55, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }));
        };
        const instalar = app => {
            if (app.estado !== 'disponible') return;
            if (prefersReducedMotion) { ponerEstado(app, 'lista'); alTerminar(); return; }
            ponerEstado(app, 'bajando');
            const inicio = performance.now(), dura = 1300 + Math.random() * 900;
            const paso = ahora => {
                const p = Math.min(1, (ahora - inicio) / dura);
                app.relleno.style.transform = `scaleX(${p.toFixed(3)})`;
                app.texto.textContent = Math.round(p * 100) + ' %';
                if (p > 0.7 && app.estado === 'bajando') ponerEstado(app, 'instalando');
                if (p < 1) { requestAnimationFrame(paso); return; }
                app.relleno.style.transform = '';
                ponerEstado(app, 'lista');
                app.icono.animate([{ scale: 1 }, { scale: 1.14 }, { scale: 1 }], { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
                alTerminar();
            };
            requestAnimationFrame(paso);
        };
        // Abrir: el icono viaja de su tarjeta al centro, como al lanzar la app
        let abriendo = false;
        const abrir = async app => {
            if (abriendo) return;
            abriendo = true;
            cuenta.textContent = T(`Abriendo ${app.nombre}`, `Opening ${app.nombre}`);
            capa.style.setProperty('--app', app.li.style.getPropertyValue('--app'));
            capa.querySelector('strong').textContent = app.nombre;
            const clon = app.icono.cloneNode();
            capa.prepend(clon);
            capa.classList.add('visible');
            if (!prefersReducedMotion) {
                const de = app.icono.getBoundingClientRect(), a = clon.getBoundingClientRect();
                const desde = `translate(${de.left + de.width / 2 - a.left - a.width / 2}px, ${de.top + de.height / 2 - a.top - a.height / 2}px) scale(${de.width / a.width})`;
                await clon.animate([{ transform: desde }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).finished;
            }
            await new Promise(r => setTimeout(r, app.capturas.length ? 300 : 750));
            if (app.capturas.length) abrirVentana(app);
            capa.classList.remove('visible');
            setTimeout(() => { clon.remove(); abriendo = false; pintarCuenta(); }, 200);
        };
        // La ventana de la app abierta, con sus capturas: pasan solas (no con el ratón encima ni con movimiento reducido);
        // ‹ ›, los puntos o ←/→ van a otra; Esc, ✕ o clic fuera la cierran
        const ventana = document.createElement('dialog');
        ventana.className = 'lz-ventana';
        ventana.setAttribute('aria-labelledby', 'lz-v-nombre');
        ventana.innerHTML = `<div class="lz-v-barra"><span class="lz-v-luces" aria-hidden="true"><i></i><i></i><i></i></span><img alt="" width="18" height="18"><strong id="lz-v-nombre"></strong><span class="lz-v-titulo"></span><span class="lz-v-cuenta"></span><button type="button" class="lz-v-cerrar" aria-label="${T('Cerrar', 'Close')}"><i class="fas fa-xmark" aria-hidden="true"></i></button></div>`
            + `<div class="lz-v-pantalla"><button type="button" class="lz-v-flecha ant" aria-label="${T('Captura anterior', 'Previous screenshot')}"><i class="fas fa-chevron-left" aria-hidden="true"></i></button><button type="button" class="lz-v-flecha sig" aria-label="${T('Captura siguiente', 'Next screenshot')}"><i class="fas fa-chevron-right" aria-hidden="true"></i></button></div>`
            + '<div class="lz-v-pasos"></div>';
        document.body.append(ventana);
        const pantalla = ventana.querySelector('.lz-v-pantalla'), pasosV = ventana.querySelector('.lz-v-pasos');
        let enVentana = null, iCaptura = 0, pasoT;
        const irCaptura = i => {
            const cs = enVentana.capturas;
            iCaptura = (i + cs.length) % cs.length;
            pantalla.querySelectorAll('img').forEach((f, j) => f.classList.toggle('ver', j === iCaptura));
            pasosV.querySelectorAll('button').forEach((p, j) => p.setAttribute('aria-current', String(j === iCaptura)));
            ventana.querySelector('.lz-v-titulo').textContent = cs[iCaptura].titulo;
            ventana.querySelector('.lz-v-cuenta').textContent = `${dos(iCaptura + 1)} / ${dos(cs.length)}`;
            clearTimeout(pasoT);
            if (!prefersReducedMotion) pasoT = setTimeout(avanzar, 5000);
        };
        const avanzar = () => {
            if (!ventana.open) return;
            if (pantalla.matches(':hover')) pasoT = setTimeout(avanzar, 5000);
            else irCaptura(iCaptura + 1);
        };
        const abrirVentana = app => {
            enVentana = app;
            ventana.style.setProperty('--app', app.li.style.getPropertyValue('--app'));
            ventana.querySelector('.lz-v-barra img').src = app.icono.getAttribute('src');
            ventana.querySelector('#lz-v-nombre').textContent = app.nombre;
            pantalla.querySelectorAll('img').forEach(f => f.remove());
            pantalla.prepend(...app.capturas.map((c, j) => {
                const f = document.createElement('img');
                f.src = c.src; f.alt = c.titulo; f.width = 1200; f.height = 900; f.decoding = 'async';
                if (j === 0) f.fetchPriority = 'high';
                return f;
            }));
            pasosV.replaceChildren(...app.capturas.map((c, j) => {
                const p = document.createElement('button');
                p.type = 'button'; p.title = c.titulo; p.setAttribute('aria-label', `${c.titulo} (${j + 1} ${T('de', 'of')} ${app.capturas.length})`);
                p.addEventListener('click', () => irCaptura(j));
                return p;
            }));
            ventana.showModal();
            irCaptura(0);
        };
        ventana.querySelector('.lz-v-cerrar').addEventListener('click', () => ventana.close());
        ventana.querySelector('.lz-v-flecha.ant').addEventListener('click', () => irCaptura(iCaptura - 1));
        ventana.querySelector('.lz-v-flecha.sig').addEventListener('click', () => irCaptura(iCaptura + 1));
        ventana.addEventListener('click', ev => { if (ev.target === ventana) ventana.close(); });   // en el fondo, fuera de la ventana
        ventana.addEventListener('keydown', ev => {
            const k = { ArrowLeft: -1, ArrowRight: 1 }[ev.key];
            if (k) { ev.preventDefault(); irCaptura(iCaptura + k); }
        });
        ventana.addEventListener('close', () => { clearTimeout(pasoT); enVentana?.btn.focus({ preventScroll: true }); });
        apps.forEach(app => {
            ponerEstado(app, 'disponible');
            app.btn.addEventListener('click', () => (app.estado === 'lista' ? abrir(app) : instalar(app)));
        });
        lanzador.querySelector('[data-a="todas"]').addEventListener('click', () => {
            apps.filter(a => a.estado === 'disponible').forEach((a, k) => setTimeout(() => instalar(a), prefersReducedMotion ? 0 : k * 170));
        });
        lanzador.querySelector('[data-a="reiniciar"]').addEventListener('click', () => {
            apps.forEach(a => ponerEstado(a, 'disponible'));
            lanzador.classList.remove('listo');
            lanzador.querySelector('[data-a="todas"]').focus();
            pintarCuenta();
        });
        pintarCuenta();
    }
    // --- Bloque de código: pestañas, números de línea, líneas resaltadas y copiar (como CodeBlock de shadcn, sin React) ---
    document.querySelectorAll('[data-codigo]').forEach((fig) => {
        const fuentes = [...fig.querySelectorAll('script[type="text/plain"]')];
        if (!fuentes.length) return;
        const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const REGLAS = {
            ts: /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(import|from|export|async|await|function|return|const|let|type|new|if|else|for|of)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Z]\w*)\b|\b([a-z_]\w*)(?=\s*\()/gm,
            cfg: /(^\s*!.*$)|(\b\B)|(^\s*(?:no\s+)?(?:vlan|name|interface|description|switchport|spanning-tree|ip)\b)|\b(\d+(?:[.,/]\d+)*)\b|\b([A-Z][A-Za-z]*Ethernet[\d/]+|[A-Z]{3,})|\b(mode|trunk|allowed|portfast|dhcp|snooping)\b/gm,
            yaml: /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(^\s*[\w-]+(?=:))|\b(\d+(?:\.\d+)?)\b|(\b\B)|(\b(?:postgres|unless-stopped)\b)/gm,
        };
        const CLASES = ['', 'tk-com', 'tk-str', 'tk-key', 'tk-num', 'tk-tipo', 'tk-fn'];
        const resaltar = (codigo, leng) => {
            const re = REGLAS[leng];
            if (!re) return esc(codigo);
            return codigo.split('\n').map((linea) => {
                let html = '', ult = 0;
                linea.replace(re, (m, ...g) => {
                    const pos = g[6];
                    const k = g.slice(0, 6).findIndex((x) => x);
                    if (k < 0 || !m) return m;
                    html += esc(linea.slice(ult, pos)) + `<span class="${CLASES[k + 1]}">${esc(m)}</span>`;
                    ult = pos + m.length;
                    return m;
                });
                return html + esc(linea.slice(ult));
            });
        };
        const pestanas = fuentes.map((s) => ({
            nombre: s.dataset.nombre || 'código',
            codigo: s.textContent.replace(/^\n/, '').replace(/\s+$/, ''),
            lenguaje: s.dataset.lenguaje || '',
            lineas: (s.dataset.resaltar || '').split(',').map(Number).filter(Boolean),
        }));
        fuentes.forEach((s) => s.remove());

        const caja = document.createElement('div');
        caja.className = 'codigo-caja';
        const uid = 'cod' + Math.random().toString(36).slice(2, 7);
        caja.innerHTML = `<div class="codigo-barra">
                <span class="codigo-luces" aria-hidden="true"><i></i><i></i><i></i></span>
                <div class="codigo-tabs" role="tablist">${pestanas.map((p, i) =>
                    `<button type="button" role="tab" id="${uid}-t${i}" aria-controls="${uid}-p" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(p.nombre)}</button>`).join('')}</div>
                <button type="button" class="codigo-copiar" aria-label="${T('Copiar código', 'Copy code')}"><i class="fas fa-copy" aria-hidden="true"></i><span>${T('Copiar', 'Copy')}</span></button>
            </div>
            <div class="codigo-cuerpo" role="tabpanel" id="${uid}-p" tabindex="0"><pre><code></code></pre></div>`;
        fig.insertBefore(caja, fig.firstChild);
        const tabs = [...caja.querySelectorAll('[role="tab"]')];
        const codigo = caja.querySelector('code');
        const panel = caja.querySelector('[role="tabpanel"]');
        const copiar = caja.querySelector('.codigo-copiar');
        let activa = 0;

        const mostrar = (i, foco) => {
            activa = i;
            tabs.forEach((b, j) => {
                b.setAttribute('aria-selected', j === i);
                b.tabIndex = j === i ? 0 : -1;
            });
            if (foco) tabs[i].focus();
            const lista = tabs[i].parentElement, b = tabs[i];
            if (b.offsetLeft < lista.scrollLeft || b.offsetLeft + b.offsetWidth > lista.scrollLeft + lista.clientWidth)
                lista.scrollTo({ left: b.offsetLeft - 8, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            const p = pestanas[i];
            panel.setAttribute('aria-labelledby', tabs[i].id);
            panel.dataset.lenguaje = p.lenguaje;
            codigo.innerHTML = resaltar(p.codigo, p.lenguaje).map((l, j) =>
                `<span class="ln${p.lineas.includes(j + 1) ? ' on' : ''}" data-n="${j + 1}" style="--i:${j}">${l || ' '}</span>`).join('');
            caja.classList.remove('entra');
            void caja.offsetWidth;
            caja.classList.add('entra');
        };
        tabs.forEach((b, i) => b.addEventListener('click', () => mostrar(i)));
        caja.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
            const paso = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); mostrar(e.key === 'Home' ? 0 : tabs.length - 1, true); }
            else if (paso) { e.preventDefault(); mostrar((activa + paso + tabs.length) % tabs.length, true); }
        });

        let reloj;
        copiar.addEventListener('click', async () => {
            const texto = pestanas[activa].codigo;
            try {
                await navigator.clipboard.writeText(texto);
            } catch {
                const ta = Object.assign(document.createElement('textarea'), { value: texto });
                ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            copiar.classList.add('hecho');
            copiar.querySelector('i').className = 'fas fa-check';
            copiar.querySelector('span').textContent = T('Copiado', 'Copied');
            clearTimeout(reloj);
            reloj = setTimeout(() => {
                copiar.classList.remove('hecho');
                copiar.querySelector('i').className = 'fas fa-copy';
                copiar.querySelector('span').textContent = T('Copiar', 'Copy');
            }, 2000);
        });

        mostrar(0);
        caja.classList.remove('entra');
        if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver((ents) => {
                if (ents.some((e) => e.isIntersecting)) { caja.classList.add('entra'); obs.disconnect(); }
            }, { threshold: 0.25 });
            obs.observe(caja);
        } else caja.classList.add('entra');
    });
});