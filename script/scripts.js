document.addEventListener('DOMContentLoaded', () => {
    
    // --- Menú Móvil (Hamburguesa) ---
    const mobileMenu = document.querySelector('#mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    mobileMenu.addEventListener('click', () => {
        // Alternar clase 'active' en los enlaces
        navLinks.classList.toggle('active');

        // Animación de la hamburguesa
        mobileMenu.classList.toggle('is-active');
        mobileMenu.setAttribute('aria-expanded', navLinks.classList.contains('active'));
    });

    // Cerrar menú al hacer clic en un enlace (móvil)
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenu.classList.remove('is-active');
                mobileMenu.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // --- Resaltado de Sección Activa en Scroll ---
    const sections = document.querySelectorAll('section');
    const navLi = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // Detectar qué sección está visible en pantalla
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLi.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href').includes(current)) {
                a.classList.add('active');
            }
        });
    });

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Header dinámico + barra de progreso de scroll ---
    const header = document.querySelector('.header');
    const scrollProgress = document.querySelector('#scroll-progress');

    function updateScrollChrome() {
        const scrollTop = window.scrollY;
        if (header) header.classList.toggle('is-scrolled', scrollTop > 10);
        if (scrollProgress) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
            scrollProgress.style.width = pct + '%';
        }
    }
    window.addEventListener('scroll', updateScrollChrome, { passive: true });
    updateScrollChrome();

    // --- Animación de aparición al hacer scroll ---
    const revealTargets = document.querySelectorAll(
        '.service-card, .stat, .tech-panel, .blog-card, .contact-info, .section-title, .plan-card, .video-card'
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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
            // Inclinación 3D en las tarjetas destacadas
            const tiltEls = document.querySelectorAll('.service-card, .tech-panel');
            tiltEls.forEach(el => {
                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width;
                    const py = (e.clientY - rect.top) / rect.height;
                    const rotateX = (0.5 - py) * 8;
                    const rotateY = (px - 0.5) * 8;
                    el.style.transform =
                        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
                });
                el.addEventListener('mouseleave', () => {
                    el.style.transform = '';
                });
            });

            // El fondo líquido reacciona sutilmente al movimiento del cursor
            const liquidBg = document.querySelector('.liquid-bg');
            if (liquidBg) {
                window.addEventListener('mousemove', (e) => {
                    const x = (e.clientX / window.innerWidth - 0.5) * 40;
                    const y = (e.clientY / window.innerHeight - 0.5) * 40;
                    liquidBg.style.transform = `translate(${x}px, ${y}px)`;
                });
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
});