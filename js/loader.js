/* ═══════════════════════════════════════════════════════
   LOADER.JS — Cinematic Loading Experience
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('cinema-loader');
    const canvas = document.getElementById('loader-canvas');
    const progressFill = document.getElementById('loader-progress-fill');
    const percentText = document.getElementById('loader-percent');
    const messageText = document.getElementById('loader-message');
    const logoOutline = document.querySelector('.loader-logo-outline');
    const logoGlow = document.querySelector('.loader-logo-glow');
    const logoImg = document.querySelector('.loader-logo-img');
    const logoSweep = document.querySelector('.loader-logo-sweep');

    if (!loader || !canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── Resize Canvas ──
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ── Ambient Background Particle Setup ──
    const particles = [];
    const particleCount = Math.min(Math.floor((W * H) / 25000), 30);

    class GoldParticle {
        constructor() {
            this.reset();
            this.y = Math.random() * H;
        }
        reset() {
            this.x = Math.random() * W;
            this.y = H + 20;
            this.size = Math.random() * 2.2 + 0.6;
            this.vy = -(Math.random() * 0.28 + 0.12);
            this.vx = (Math.random() - 0.5) * 0.15;
            this.alpha = Math.random() * 0.35 + 0.15;
            this.flickerSpeed = Math.random() * 0.008 + 0.002;
            this.angle = Math.random() * Math.PI * 2;
            this.oscSpeed = Math.random() * 0.01 + 0.004;
        }
        update() {
            this.y += this.vy;
            this.x += this.vx + Math.sin(this.angle) * 0.08;
            this.angle += this.oscSpeed;
            
            // Subtle breathing alpha
            this.alpha += Math.sin(this.angle) * 0.02;
            if (this.alpha < 0.05) this.alpha = 0.05;
            if (this.alpha > 0.6) this.alpha = 0.6;

            if (this.y < -20 || this.x < -20 || this.x > W + 20) {
                this.reset();
            }
        }
        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
            ctx.shadowBlur = this.size * 3;
            ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new GoldParticle());
    }

    // ── Volumetric Rays Setup ──
    const rays = [
        { x: W * 0.3, width: 140, targetWidth: 220, alpha: 0.06, speed: 0.0012, angle: 0 },
        { x: W * 0.5, width: 220, targetWidth: 320, alpha: 0.08, speed: 0.0008, angle: Math.PI / 4 },
        { x: W * 0.7, width: 160, targetWidth: 260, alpha: 0.05, speed: 0.0010, angle: Math.PI / 2 }
    ];

    function drawRays() {
        rays.forEach(ray => {
            ray.angle += ray.speed;
            const currentWidth = ray.width + Math.sin(ray.angle) * (ray.targetWidth - ray.width) * 0.5;
            const currentAlpha = ray.alpha + Math.sin(ray.angle) * 0.02;

            const grad = ctx.createLinearGradient(ray.x, 0, ray.x + 40, H);
            grad.addColorStop(0, `rgba(212, 175, 55, ${currentAlpha})`);
            grad.addColorStop(0.5, `rgba(212, 175, 55, ${currentAlpha * 0.4})`);
            grad.addColorStop(1, 'rgba(212, 175, 55, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(ray.x - currentWidth * 0.5, 0);
            ctx.lineTo(ray.x + currentWidth * 0.5, 0);
            ctx.lineTo(ray.x + currentWidth * 0.2 + 80, H);
            ctx.lineTo(ray.x - currentWidth * 0.2 + 80, H);
            ctx.closePath();
            ctx.fill();
        });
    }

    // ── Animation Loop ──
    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Draw light rays
        drawRays();

        // Update & Draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(draw);
    }
    draw();

    // ── Dynamic Messages ──
    const messages = [
        "Preparing Experience...",
        "Loading Ministry...",
        "Gathering Resources...",
        "Building Community...",
        "Initializing Animations...",
        "Loading Media...",
        "Preparing Worship Experience...",
        "Finalizing..."
    ];
    let msgIndex = 0;
    
    const messageInterval = setInterval(() => {
        if (targetProgress < 100) {
            messageText.style.opacity = '0';
            setTimeout(() => {
                msgIndex = (msgIndex + 1) % messages.length;
                messageText.textContent = messages[msgIndex];
                messageText.style.opacity = '1';
            }, 400);
        }
    }, 2800);

    // ── Asset & Hybrid Progress Tracker ──
    let currentProgress = 0;
    let targetProgress = 0;
    let isComplete = false;

    // We will automatically increment targetProgress towards 100 over ~2.8 seconds
    // to guarantee it finishes within 3-4 seconds.
    const startTime = Date.now();
    const duration = 2800; // 2.8 seconds target time to reach 100%

    // Check if the window is already loaded to speed it up
    const heroVideo = document.getElementById('hero-logo');
    let assetsLoaded = false;
    if (document.readyState === 'complete') {
        assetsLoaded = true;
    } else {
        window.addEventListener('load', () => {
            assetsLoaded = true;
        });
    }

    const progressTicker = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Calculate base progress based on time elapsed
        let baseProgress = Math.min((elapsed / duration) * 100, 100);

        // Verify if video has finished pre-buffering (readyState >= 3 is HAVE_FUTURE_DATA)
        const videoReady = (!heroVideo || heroVideo.readyState >= 3 || elapsed > 4500);

        // Hold loading bar at 90% if video is still buffering and we haven't hit the 4.5s fallback limit
        if (baseProgress >= 90 && !videoReady) {
            baseProgress = 90;
        }

        // If real assets are loaded, accelerate progress to 100%
        if (assetsLoaded && baseProgress > 50 && videoReady) {
            baseProgress = Math.min(baseProgress + 25, 100);
        }

        targetProgress = Math.max(targetProgress, Math.round(baseProgress));

        if (currentProgress < targetProgress) {
            // Smoothly ease currentProgress towards targetProgress
            currentProgress += (targetProgress - currentProgress) * 0.12;

            if (targetProgress - currentProgress < 0.5) {
                currentProgress = targetProgress;
            }

            const displayPercent = Math.round(currentProgress);
            
            // Update UI elements
            percentText.textContent = `${displayPercent}%`;
            progressFill.style.width = `${displayPercent}%`;

            // Milestone Reveals
            if (displayPercent >= 40 && !loader.classList.contains('step-40')) {
                loader.classList.add('step-40');
                logoOutline.style.opacity = '1';
                logoOutline.style.transform = 'scale(1)';
            }
            
            if (displayPercent >= 70 && !loader.classList.contains('step-70')) {
                loader.classList.add('step-70');
                logoGlow.style.opacity = '1';
            }

            if (displayPercent >= 90 && !loader.classList.contains('step-90')) {
                loader.classList.add('step-90');
                logoSweep.style.animation = 'sweepLight 1.2s ease-in-out forwards';
            }

            if (displayPercent >= 100) {
                clearInterval(progressTicker);
                runExitSequence();
            }
        }
    }, 16);

    // ── Exit Animation Sequence ──
    function runExitSequence() {
        if (isComplete) return;
        isComplete = true;
        
        clearInterval(messageInterval);
        
        // Update texts to welcome state
        const celestialLabel = document.querySelector('.celestial-text');
        if (celestialLabel) {
            celestialLabel.textContent = "Welcome";
            celestialLabel.style.letterSpacing = '3px';
            celestialLabel.style.color = 'var(--gold)';
            celestialLabel.style.fontWeight = '700';
        }
        percentText.textContent = "✓";
        messageText.textContent = "Sanctuary Loaded";
        messageText.style.color = 'var(--gold)';

        // 1. Logo Golden Pulse
        setTimeout(() => {
            logoImg.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            logoImg.style.transform = 'scale(1.15)';
            logoGlow.style.transform = 'scale(1.3)';
            logoGlow.style.background = 'radial-gradient(circle, rgba(212, 175, 55, 0.65) 0%, transparent 70%)';
            logoOutline.style.borderColor = 'rgba(212, 175, 55, 0.9)';
            logoOutline.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.6)';

            // Brighten particles briefly
            particles.forEach(p => {
                p.alpha = Math.min(p.alpha * 2, 0.95);
                p.vy *= 2;
            });
        }, 300);

        // 2. Full overlay fade out + scale down + blur disappear
        setTimeout(() => {
            loader.style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 1s ease';
            loader.style.opacity = '0';
            loader.style.transform = 'scale(0.96)';
            loader.style.filter = 'blur(10px)';
        }, 1200);

        // 3. Remove from DOM
        setTimeout(() => {
            loader.remove();
        }, 2250);
    }
});
