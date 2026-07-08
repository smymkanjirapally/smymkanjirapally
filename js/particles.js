/* ═══════════════════════════════════════════════════════
   PARTICLES.JS v2.0 — Premium Physics Particle System
   Features:
     1. ~350 ambient particles in 3 depth layers
     2. Smooth physics: velocity, damping, oscillation
     3. Connecting lines between nearby particles
     4. Mouse repulsion + attraction with smooth physics
     5. Interactive trail particles (brighter while moving)
     6. 60fps optimised with hardware acceleration
   ═══════════════════════════════════════════════════════ */

(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;

    const mouse = { x: -9999, y: -9999, active: false, vx: 0, vy: 0, prevX: -9999, prevY: -9999 };
    let isMouseMoving = false;
    let mouseStopTimer = null;

    // ── Canvas resize with DPR ──
    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ── Track mouse ──
    window.addEventListener('mousemove', (e) => {
        mouse.vx = e.clientX - mouse.prevX;
        mouse.vy = e.clientY - mouse.prevY;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;

        isMouseMoving = true;
        clearTimeout(mouseStopTimer);
        mouseStopTimer = setTimeout(() => { isMouseMoving = false; }, 120);

        // Spawn trail particles (intensify when hovering over links/buttons)
        const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
        const isHovering = document.body.classList.contains('cursor-hovering');
        const multiplier = isHovering ? 2.5 : 1.0;
        const count = Math.min(Math.floor(speed * 0.5 * multiplier) + (isHovering ? 3 : 1), 12);
        for (let i = 0; i < count; i++) {
            trailParticles.push(new TrailParticle(mouse.x, mouse.y, isMouseMoving, isHovering));
        }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
        mouse.active = false;
        isMouseMoving = false;
    }, { passive: true });

    // ── Depth layer config ──
    const LAYERS = [
        // background layer: small, slow, very subtle
        { count: 0.45, sizeMin: 0.1, sizeMax: 0.35,  speedMin: 0.08, speedMax: 0.22, opacity: [0.08, 0.22] },
        // mid layer: medium
        { count: 0.35, sizeMin: 0.25, sizeMax: 0.65,  speedMin: 0.18, speedMax: 0.38, opacity: [0.18, 0.50] },
        // foreground: larger, faster, brighter
        { count: 0.20, sizeMin: 0.5, sizeMax: 0.95,  speedMin: 0.30, speedMax: 0.55, opacity: [0.35, 0.80] },
    ];

    // ── Color palettes (light bg and dark bg adaptive) ──
    function pickColor(opMin, opMax) {
        const r = Math.random();
        const a = (Math.random() * (opMax - opMin) + opMin).toFixed(2);
        if (r < 0.55) {
            return { fill: `rgba(255,255,255,${a})`,   glow: `rgba(255,255,255,${(+a*0.5).toFixed(2)})` };
        } else if (r < 0.80) {
            return { fill: `rgba(244,197,66,${a})`,    glow: `rgba(212,175,55,${(+a*0.6).toFixed(2)})` };
        } else {
            return { fill: `rgba(200,30,30,${a})`,     glow: `rgba(180,10,10,${(+a*0.5).toFixed(2)})` };
        }
    }

    // ── Ambient Particle ──
    class AmbientParticle {
        constructor(layer, initial = false) {
            this.layer = layer;
            this.reset(initial);
        }

        reset(initial = false) {
            const cfg = LAYERS[this.layer];
            this.x   = Math.random() * W;
            this.y   = initial ? Math.random() * H : H + 10;
            this.size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);

            // Base velocity
            this.vy   = -(cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin));
            this.vx   = (Math.random() - 0.5) * 0.12;

            // Oscillation
            this.angle  = Math.random() * Math.PI * 2;
            this.freq   = 0.005 + Math.random() * 0.012;
            this.amp    = 0.15 + Math.random() * 0.35;

            // Color
            const col = pickColor(cfg.opacity[0], cfg.opacity[1]);
            this.fill = col.fill;
            this.glow = col.glow;
        }

        update(t) {
            // Oscillate sideways
            this.vx  = Math.sin(t * this.freq + this.angle) * this.amp;
            this.x  += this.vx;
            this.y  += this.vy;

            // Mouse repulsion (smooth, radius-based)
            if (mouse.active) {
                const dx   = this.x - mouse.x;
                const dy   = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const REPEL = 180;
                const ATTRACT = 360;

                if (dist < REPEL && dist > 0.5) {
                    // Repel
                    const force = ((REPEL - dist) / REPEL) * 0.9;
                    this.x += (dx / dist) * force;
                    this.y += (dy / dist) * force;
                } else if (dist < ATTRACT && dist > REPEL) {
                    // Gentle gravitational pull
                    const force = ((ATTRACT - dist) / ATTRACT) * 0.06;
                    this.x -= (dx / dist) * force;
                    this.y -= (dy / dist) * force;
                }
            }

            // Recycle
            if (this.y < -15 || this.x < -20 || this.x > W + 20) {
                this.reset(false);
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.fill;
            ctx.fill();
        }
    }

    // ── Trail Particle ──
    class TrailParticle {
        constructor(x, y, bright = false, hover = false) {
            this.x = x + (Math.random() - 0.5) * (hover ? 12 : 8);
            this.y = y + (Math.random() - 0.5) * (hover ? 12 : 8);
            // Smaller initial size for fine dust feel
            this.size  = (hover ? 0.15 : 0.08) + Math.random() * (hover ? 0.20 : 0.12);
            this.vx    = (Math.random() - 0.5) * (hover ? 3.8 : 2.8);
            this.vy    = (Math.random() - 0.5) * (hover ? 3.8 : 2.8) - 0.5;
            this.alpha = bright ? 1.0 : 0.75;
            this.bright = bright;
            this.hover = hover;
            // Higher decay speed for 1-1.5s lifetime (60-90 frames)
            this.fadeSpeed = (hover ? 0.012 : 0.015) + Math.random() * 0.012;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.fadeSpeed;
            // Grow very minimally so particles remain small and fine
            if (this.size < (this.hover ? 1.6 : 1.0)) this.size += 0.03;
            this.vx *= 0.965;
            this.vy *= 0.965;
        }

        draw() {
            if (this.alpha <= 0) return;
            let r, g, b;
            if (this.alpha > 0.6) {
                const ratio = (this.alpha - 0.6) / 0.4;
                r = Math.round(255 + (220 - 255) * ratio);
                g = Math.round(255 + (30  - 255) * ratio);
                b = Math.round(255 + (30  - 255) * ratio);
            } else {
                const ratio = this.alpha / 0.6;
                r = Math.round(244 + (255 - 244) * ratio);
                g = Math.round(197 + (255 - 197) * ratio);
                b = Math.round(66  + (255 - 66)  * ratio);
            }

            const brightMult = this.bright ? 1.35 : 1.0;
            const hoverMult = this.hover ? 1.4 : 1.0;
            const finalAlpha = Math.min(this.alpha * 0.8 * brightMult * hoverMult, 1.0);

            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${finalAlpha})`;
            ctx.shadowBlur = this.size * (this.hover ? 3.5 : this.bright ? 2.5 : 1.5);
            ctx.shadowColor = `rgba(${r},${g},${b},${(finalAlpha * 0.5).toFixed(2)})`;
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Build particle pool by layer ──
    const BASE_COUNT = Math.min(Math.floor((W * H) / 5200), 350);
    const particles = [];

    LAYERS.forEach((cfg, layerIdx) => {
        const n = Math.round(BASE_COUNT * cfg.count);
        for (let i = 0; i < n; i++) {
            particles.push(new AmbientParticle(layerIdx, true));
        }
    });

    const trailParticles = [];

    // ── Connection line drawing ──
    const MAX_DIST    = window.innerWidth < 1024 ? 65 : 115;  // scale down on mobile to prevent dense spiderwebs
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

    function drawConnections() {
        // Only connect foreground+mid layer (indices where size >= 0.5px)
        const eligible = particles.filter(p => p.layer >= 1);
        const n = eligible.length;

        for (let i = 0; i < n - 1; i++) {
            const a = eligible[i];
            for (let j = i + 1; j < n; j++) {
                const b  = eligible[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dSq = dx * dx + dy * dy;

                if (dSq < MAX_DIST_SQ) {
                    const dist   = Math.sqrt(dSq);
                    const alpha  = (1 - dist / MAX_DIST) * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(212,175,55,${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    // ── Animation loop ──
    let t = 0;
    function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, W, H);
        t++;

        // 1. Draw connection lines (behind particles)
        drawConnections();

        // 2. Draw ambient particles (back to front: layer 0 → 2)
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(t);
            particles[i].draw();
        }

        // 3. Draw trail particles
        for (let i = trailParticles.length - 1; i >= 0; i--) {
            const p = trailParticles[i];
            p.update();
            if (p.alpha <= 0) {
                trailParticles.splice(i, 1);
            } else {
                p.draw();
            }
        }
    }

    loop();
})();
