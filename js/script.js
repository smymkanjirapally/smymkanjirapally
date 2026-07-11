/* ═══════════════════════════════════════════════════════
   SCRIPT.JS v2.0 — Master Interaction Controller
   Handles:
     1. Scroll-based nav style & hide/show
     2. Cursor glow ambient follow
     3. Premium custom cursor (dot + ring) with spring easing
     4. GSAP pinned hero parallax (desktop)
     5. Scroll-reveal (IntersectionObserver) with blur
     6. 3D card tilt on [data-tilt] elements
     7. Social card 3D tilt with brand glow
     8. Magnetic CTA button
     9. Animated number counters
    10. Testimonial carousel
    11. Active nav link tracking
    12. Mobile menu toggle
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ══════════════════════════════════════════
       1. NAV — scroll style & hide/show
          - Nav starts visible
          - Hides when scrolling DOWN (past threshold)
          - Shows when scrolling UP
    ══════════════════════════════════════════ */
    let lastScrollY = window.scrollY;
    const nav = document.getElementById('nav');
    const deltaThreshold = 5;

    const onScroll = () => {
        const cur = window.scrollY;

        // Toggle background styling
        nav.classList.toggle('scrolled', cur > 40);

        if (Math.abs(cur - lastScrollY) < deltaThreshold) return;

        const mobileMenuOpen = document.getElementById('mobile-menu')?.classList.contains('open');

        if (cur > lastScrollY && cur > 80 && !mobileMenuOpen) {
            // Scrolling down: slide up & hide
            nav.classList.add('nav-hidden');
        } else if (cur < lastScrollY) {
            // Scrolling up: slide down & show
            nav.classList.remove('nav-hidden');
        }
        lastScrollY = cur;
    };
    window.addEventListener('scroll', onScroll, { passive: true });


    /* ══════════════════════════════════════════
       2. CURSOR GLOW — ambient follow
    ══════════════════════════════════════════ */
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        window.addEventListener('mousemove', (e) => {
            cursorGlow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
            cursorGlow.style.opacity = '1';
        }, { passive: true });
        window.addEventListener('mouseleave', () => {
            cursorGlow.style.opacity = '0';
        });
    }


    /* ══════════════════════════════════════════
       3. CUSTOM CURSOR — dot + ring with easing
    ══════════════════════════════════════════ */
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    if (cursorDot && cursorRing) {
        let ringX = 0, ringY = 0;
        let mouseX = 0, mouseY = 0;
        let hasMoved = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Dot follows instantly (CSS top/left)
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';

            if (!hasMoved) {
                cursorDot.style.opacity = '1';
                cursorRing.style.opacity = '1';
                ringX = mouseX;
                ringY = mouseY;
                hasMoved = true;
            }
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorRing.style.opacity = '0';
        });
        window.addEventListener('mouseenter', () => {
            if (hasMoved) {
                cursorDot.style.opacity = '1';
                cursorRing.style.opacity = '1';
            }
        });

        // Hover state on interactive elements
        const hoverTargets = 'a, button, .btn, .social-card, .nav-toggle, [data-tilt], .testi-btn, .event-card';
        document.querySelectorAll(hoverTargets).forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hovering'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hovering'));
        });

        // Ring follows with lag via RAF lerp + Unified Parallax Loop
        let ringX_lerp = 0;
        let ringY_lerp = 0;

        // Parallax variables
        let pMouseX = 0, pMouseY = 0;
        let pSmoothX = 0, pSmoothY = 0;
        let currentScroll = 0;
        let smoothScroll = 0;

        window.addEventListener('mousemove', (e) => {
            pMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            pMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });

        window.addEventListener('scroll', () => {
            currentScroll = window.scrollY;
        }, { passive: true });

        const parallaxLeft = document.querySelector('.hero-parallax-left-inner');
        const parallaxRight = document.querySelector('.hero-parallax-right-inner');
        const parallaxLogo = document.querySelector('.hero-parallax-logo-inner');
        const gridOverlay = document.querySelector('.hero-grid-overlay');
        const rays = document.querySelector('.hero-rays');

        function mainLoop() {
            requestAnimationFrame(mainLoop);

            // 1. Cursor Ring Easing
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';

            // 2. Parallax Lerp Calculations
            pSmoothX += (pMouseX - pSmoothX) * 0.08;
            pSmoothY += (pMouseY - pSmoothY) * 0.08;
            smoothScroll += (currentScroll - smoothScroll) * 0.08;

            // 3. Hero text columns are FIXED — no mouse float effect
            // (parallaxLeft and parallaxRight are intentionally not moved)

            if (gridOverlay) {
                const mx = pSmoothX * -8;
                const my = pSmoothY * -8;
                gridOverlay.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
            }
            if (rays) {
                const mx = pSmoothX * -12;
                const my = pSmoothY * -12;
                rays.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
            }
        }
        mainLoop();
    }


    /* ══════════════════════════════════════════
       4. GSAP PAGE-LOAD & SCROLL PARALLAX (Desktop)
     ══════════════════════════════════════════ */
    gsap.registerPlugin(ScrollTrigger);

    const heroEl = document.getElementById('hero');
    const logoWrap = document.querySelector('.logo-glass-bg');

    if (heroEl && logoWrap) {
        const navH = document.getElementById('nav')?.offsetHeight || 70;
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        // On desktop: start logo as large fullscreen circle
        if (vw >= 1024) {
            // Fullscreen size = viewport height minus nav, constrained to 90vw max
            const initSize = Math.min(vw * 0.88, (vh - navH) * 0.90);

            // Set ALL side content invisible (they live under the logo initially)
            gsap.set('#hero-left-details, #hero-right-details', { opacity: 0, visibility: 'hidden' });
            gsap.set('#hero-eyebrow, #hero-title, #hero-tagline, #hero-desc, #btn-hero-join',
                { opacity: 0, x: -80, filter: 'blur(6px)' });
            gsap.set('#hero-right-quote, #hero-right-stats, #hero-right-deco',
                { opacity: 0, x: 80, filter: 'blur(6px)', scale: 0.96 });
            // Nav remains visible at top (no GSAP hide)

            // Logo starts fullscreen — CSS centers it via top:50%, left:50%, translate(-50%,-50%)
            // GSAP only overrides width/height at init, then shrinks them on scroll
            gsap.set(logoWrap, {
                width: initSize,
                height: initSize,
                opacity: 0
            });

            // ── Load entrance: fade in logo ──
            gsap.to(logoWrap, {
                opacity: 1,
                duration: 1.1,
                ease: 'power3.out',
                delay: 0.3
            });

            // ── Scroll-driven master timeline ──
            const scrollTl = gsap.timeline({
                scrollTrigger: {
                    trigger: heroEl,
                    start: 'top top',
                    end: '+=220%',
                    scrub: 1.2,
                    pin: true,
                    anticipatePin: 1,
                    pinSpacing: true
                }
            });


            // STAGE 2 (0→40%): Logo shrinks from fullscreen → 320px
            // stays fixed centered while shrinking
            scrollTl.to(logoWrap, {
                width: 320,
                height: 320,
                ease: 'power2.inOut',
                duration: 2
            }, 0);

            // STAGE 3 (30→75%): Side content slides in after logo starts shrinking
            scrollTl.to('#hero-left-details, #hero-right-details',
                { opacity: 1, visibility: 'visible', duration: 0.5 }, 0.8);

            // Left column — staggered slide in from left
            scrollTl.to('#hero-eyebrow',
                { x: 0, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.8 }, 0.9);
            scrollTl.to('#hero-title',
                { x: 0, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.8 }, 1.05);
            scrollTl.to('#hero-tagline',
                { x: 0, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.8 }, 1.2);
            scrollTl.to('#hero-desc',
                { x: 0, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.8 }, 1.3);
            scrollTl.to('#btn-hero-join',
                { x: 0, opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'back.out(1.4)', duration: 0.8 }, 1.4);

            // Right column — staggered slide in from right (interleaved with left)
            scrollTl.to('#hero-right-quote',
                { x: 0, opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.8 }, 1.0);
            scrollTl.to('#hero-right-stats',
                { x: 0, opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.8 }, 1.15);
            scrollTl.to('#hero-right-deco',
                { x: 0, opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.6 }, 1.28);

            // STAGE 4 (75→90%): Background blobs only — text elements stay fixed
            scrollTl.to('.hero-blob-1', { y: 120, ease: 'none', duration: 1 }, 1.6);
            scrollTl.to('.hero-blob-2', { y: -80, ease: 'none', duration: 1 }, 1.6);
            scrollTl.to('.hero-blob-3', { y: 60, ease: 'none', duration: 1 }, 1.6);
            // Text elements intentionally NOT animated — they stay in place

            // STAGE 5 (90→100%): Entire hero moves up
            scrollTl.to(heroEl, { yPercent: -8, ease: 'power1.in', duration: 0.5 }, 2.0);

        } else {
            // Mobile: CSS media query handles logo position — just clear any GSAP overrides
            gsap.set(logoWrap, { clearProps: 'width,height,opacity' });
            gsap.set('#nav', { clearProps: 'all' });
        }
    }


    /* ══════════════════════════════════════════
       5. SCROLL REVEAL — blur + fade + scale
    ══════════════════════════════════════════ */
    const revealEls = document.querySelectorAll('.reveal-fade, .reveal-up, .reveal-scale');
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = +(entry.target.dataset.delay || 0);
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay * 120);
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.10, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach(el => revealObs.observe(el));


    /* ══════════════════════════════════════════
       6. 3D CARD TILT — [data-tilt] elements
    ══════════════════════════════════════════ */
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
            const rotX = -dy * 7;
            const rotY = dx * 7;

            card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
            card.style.boxShadow = `${-dx * 12}px ${-dy * 12}px 40px rgba(15,23,42,0.1), 0 20px 50px rgba(15,23,42,0.08)`;
            card.style.borderColor = `rgba(255,255,255,${0.55 + Math.abs(dx) * 0.3})`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
            card.style.borderColor = '';
        });
    });


    /* ══════════════════════════════════════════
       6b. EXECUTIVE PREMIUM CARD 3D TILT
    ══════════════════════════════════════════ */
    const execCards = document.querySelectorAll('.exec-premium-card');

    // Assign entry animation types (cascading scroll reveal)
    const execEntryTypes = ['exec-slide-left', 'exec-slide-right', 'exec-fade-up', 'exec-scale-in'];
    execCards.forEach((card, i) => {
        const type = execEntryTypes[i % 4];
        card.classList.add(type);
    });

    // IntersectionObserver for staggered card entry
    const execObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const delay = parseInt(card.dataset.delay || 0, 10);
                setTimeout(() => {
                    card.classList.add('exec-animated');
                }, delay * 120);
                execObs.unobserve(card);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    execCards.forEach(card => execObs.observe(card));

    // 3D Mouse Tilt on exec cards — applied to the inner element
    execCards.forEach(card => {
        const inner = card.querySelector('.exec-card-inner');
        if (!inner) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
            const rotX = -dy * 12;
            const rotY = dx * 12;
            inner.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            inner.style.transform = '';
        });
    });

    /* ══════════════════════════════════════════
       6c. VIDEO FREEZE AT LAST FRAME
    ══════════════════════════════════════════ */
    const heroVid = document.getElementById('hero-logo');
    if (heroVid) {
        heroVid.addEventListener('timeupdate', () => {
            // Pause at ~99.9% to freeze on last frame
            if (heroVid.duration && heroVid.currentTime >= heroVid.duration - 0.08) {
                heroVid.pause();
                heroVid.currentTime = heroVid.duration - 0.08;
            }
        });
        // Ensure video is visible
        heroVid.addEventListener('canplay', () => {
            heroVid.classList.add('active');
        });
    }


    /* ══════════════════════════════════════════
       7. SOCIAL CARD 3D TILT
       Disabled: Now handled directly by high performance CSS transitions.
    ══════════════════════════════════════════ */


    /* ══════════════════════════════════════════
       8. MAGNETIC CTA BUTTON
    ══════════════════════════════════════════ */
    document.querySelectorAll('.magnetic').forEach(btn => {
        let raf;
        document.addEventListener('mousemove', (e) => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const rect = btn.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const radius = 150;

                if (dist < radius) {
                    const pull = ((radius - dist) / radius);
                    btn.style.transform = `translate(${dx * pull * 0.3}px, ${dy * pull * 0.3}px)`;
                } else {
                    btn.style.transform = '';
                }
            });
        }, { passive: true });
    });


    /* ══════════════════════════════════════════
       9. ANIMATED NUMBER COUNTERS
    ══════════════════════════════════════════ */
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            const dur = 2400;
            const start = performance.now();

            function easeOutExpo(t) {
                return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            }

            function tick(now) {
                const prog = Math.min((now - start) / dur, 1);
                const value = Math.round(easeOutExpo(prog) * target);
                if (value >= 1000000) {
                    el.textContent = (value / 1000000).toFixed(1) + 'M' + suffix;
                } else if (value >= 1000) {
                    el.textContent = (value / 1000).toFixed(0) + 'K' + suffix;
                } else {
                    el.textContent = value + suffix;
                }
                if (prog < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            counterObs.unobserve(el);
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));


    /* ══════════════════════════════════════════
       10. TESTIMONIAL CAROUSEL
    ══════════════════════════════════════════ */
    const track = document.getElementById('testi-track');
    const dots = document.querySelectorAll('.testi-dot');
    const prevBtn = document.getElementById('testi-prev');
    const nextBtn = document.getElementById('testi-next');

    if (track) {
        let current = 0;
        const cards = track.querySelectorAll('.testi-card');
        const total = cards.length;

        function goTo(idx) {
            current = (idx + total) % total;
            const w = cards[0].getBoundingClientRect().width + 24; // card + gap
            track.style.transform = `translateX(-${current * w}px)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        prevBtn?.addEventListener('click', () => goTo(current - 1));
        nextBtn?.addEventListener('click', () => goTo(current + 1));
        dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

        // Auto-play every 6s
        setInterval(() => goTo(current + 1), 6000);
    }


    /* ══════════════════════════════════════════
       11. ACTIVE NAV LINKS
    ══════════════════════════════════════════ */
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    const sectionObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(a => a.classList.remove('active-link'));
                const link = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
                if (link) link.classList.add('active-link');
            }
        });
    }, { threshold: 0.35 });

    sections.forEach(s => sectionObs.observe(s));


    /* ══════════════════════════════════════════
       12. MOBILE MENU TOGGLE
    ══════════════════════════════════════════ */
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                mobileMenu.classList.remove('open');
            });
        });
    }


    /* ══════════════════════════════════════════
       13. HERO LOGO — 3D hover tilt (stays centered)
    ══════════════════════════════════════════ */
    const logoTiltEl = document.getElementById('hero-video-wrapper');
    if (logoTiltEl) {
        logoTiltEl.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 1024) return; // Ignore on mobile
            const rect = logoTiltEl.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            // Only apply hover tilt when logo has settled to small size (not during fullscreen intro)
            const currentW = parseFloat(logoTiltEl.style.width);
            if (!isNaN(currentW) && currentW > 400) return;
            // Apply tilt with translate(-50%,-50%) preserved so logo stays centered
            logoTiltEl.style.transform = `translate(-50%, -50%) perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) scale(1.04) translateZ(0)`;
        });
        logoTiltEl.addEventListener('mouseleave', () => {
            if (window.innerWidth < 1024) {
                logoTiltEl.style.transform = ''; // Clear inline styles on mobile
                return;
            }
            // Restore exact centering transform on desktop
            logoTiltEl.style.transform = 'translate(-50%, -50%)';
        });
    }

    /* ═══════════════════════════════════════════════════════
       EVENTS TEASER LOADER — fills the homepage events grid
       with the next 4 upcoming events from data/events.json
    ═══════════════════════════════════════════════════════ */
    (async function loadEventTeaser() {
        const grid = document.getElementById('ev-teaser-grid');
        if (!grid) return;

        const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN',
                              'JUL','AUG','SEP','OCT','NOV','DEC'];
        const MONTHS_LONG  = ['January','February','March','April','May','June',
                              'July','August','September','October','November','December'];

        function parseDate(str) {
            if (!str) return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                const d = new Date(str);
                return isNaN(d) ? null : d;
            }
            const parts = str.replace(/[-,]/g, '/').split('/').filter(Boolean);
            if (parts.length >= 3) {
                const year  = parts.find(p => p.length === 4);
                const month = parts.find(p => p.length <= 2 && parseInt(p) >= 1 && parseInt(p) <= 12 && p !== parts[0]);
                const day   = parts[0];
                if (year && month && day) {
                    const d = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
                    return isNaN(d) ? null : d;
                }
            }
            return null;
        }

        function titleCase(str) {
            return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
        }

        try {
            const res = await fetch('data/events.json');
            if (!res.ok) return;
            const raw = await res.json();

            const now      = new Date();
            const today    = new Date(now); today.setHours(0,0,0,0);
            const thisMonth = now.getMonth();
            const thisYear  = now.getFullYear();

            // Filter: events in THIS month that haven't passed yet (today or future)
            let thisMonthEvents = raw
                .map(ev => ({ ...ev, parsedDate: parseDate(ev.date) }))
                .filter(ev => {
                    if (!ev.parsedDate) return false;
                    return ev.parsedDate.getMonth() === thisMonth
                        && ev.parsedDate.getFullYear() === thisYear
                        && ev.parsedDate >= today;
                })
                .sort((a, b) => a.parsedDate - b.parsedDate);

            // If no more events this month, show next 4 upcoming instead
            const fallback = thisMonthEvents.length === 0;
            if (fallback) {
                thisMonthEvents = raw
                    .map(ev => ({ ...ev, parsedDate: parseDate(ev.date) }))
                    .filter(ev => ev.parsedDate && ev.parsedDate >= today)
                    .sort((a, b) => a.parsedDate - b.parsedDate)
                    .slice(0, 4);
            }

            // Build month heading above the grid
            const section = grid.closest('.container');
            if (section) {
                // Remove old sub-label if it exists
                const old = section.querySelector('.ev-month-teaser-label');
                if (old) old.remove();

                const label = document.createElement('div');
                label.className = 'ev-month-teaser-label reveal-fade';
                const monthLabel = fallback
                    ? 'Upcoming Events'
                    : `Events This Month — <em>${MONTHS_LONG[thisMonth]} ${thisYear}</em>`;
                label.innerHTML = monthLabel;
                grid.before(label);
            }

            // Show max 4 cards in the 2-column grid
            const toShow = thisMonthEvents.slice(0, 4);

            toShow.forEach((ev, i) => {
                const d = ev.parsedDate;
                const isToday = d.toDateString() === today.toDateString();
                const card = document.createElement('div');
                card.className = `event-card glass reveal-fade${isToday ? ' ev-card-today' : ''}`;
                card.style.setProperty('--i', i);
                card.innerHTML = `
                    <div class="event-date">
                        <span class="event-month">${MONTHS_SHORT[d.getMonth()]}</span>
                        <span class="event-day">${d.getDate()}</span>
                    </div>
                    <div class="event-info">
                        <span class="event-type${isToday ? ' gold-type' : ''}">
                            ${isToday ? '🔥 Today' : 'Program'}
                        </span>
                        <h3>${titleCase(ev.name)}</h3>
                        <p>${d.toLocaleDateString('en-IN', { weekday:'long', month:'long', day:'numeric' })}</p>
                    </div>
                    <div class="event-arrow">→</div>
                `;
                card.addEventListener('click', () => { window.location.href = 'events.html'; });
                grid.appendChild(card);
            });

            // If fewer than 4 this month, show "See All" note
            if (thisMonthEvents.length > 4) {
                const more = document.createElement('div');
                more.className = 'ev-more-note reveal-fade';
                more.innerHTML = `+${thisMonthEvents.length - 4} more events this month &nbsp;<a href="events.html">View All →</a>`;
                grid.after(more);
            }

        } catch (e) {
            // Graceful fallback
        }
    })();

});

