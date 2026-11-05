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

    function updateScrollChrome() {
        const scrollTop = window.scrollY;
        if (header) header.classList.toggle('is-scrolled', scrollTop > 10);
        if (scrollProgress) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const p = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
            scrollProgress.style.transform = `scaleX(${p})`;
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
});