/* ============================================================
   GUIDED BY — Cinematic Leadership Showcase JS
   Powered by GSAP + ScrollTrigger.
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[LeadershipShowcase] GSAP or ScrollTrigger not loaded. Skipping.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  function init() {
    try {
      buildShowcase();
    } catch (err) {
      console.error('[LeadershipShowcase] Initialization failed: ', err);
    }
  }

  function buildShowcase() {
    const outer = document.getElementById('leadership-showcase');
    if (!outer) return;

    const leaders = outer.querySelectorAll('.gls-leader');
    const dots = outer.querySelectorAll('.gls-dot');
    const currentCounter = outer.querySelector('.gls-counter-current');
    const scrollHint = outer.querySelector('.gls-scroll-hint');
    const N = leaders.length;

    if (N === 0) return;

    // Set initial states for all leaders
    leaders.forEach((leader, i) => {
      const media = leader.querySelector('.gls-left-media');
      const content = leader.querySelector('.gls-right-content');

      if (i === 0) {
        // Leader 0 is active and centered initially
        gsap.set(leader, { opacity: 1, pointerEvents: 'auto' });
        gsap.set(media, { x: 0, opacity: 1, scale: 1 });
        gsap.set(content, { x: 0, opacity: 1 });
      } else {
        // All other leaders are hidden offstage
        gsap.set(leader, { opacity: 0, pointerEvents: 'none' });
        gsap.set(media, { x: -100, opacity: 0, scale: 0.95 });
        gsap.set(content, { x: 100, opacity: 0 });
      }
    });

    // Create the master scrub timeline
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: outer,
        start: 'top top',
        end: '+=500%', // 100vh per transition
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          // Calculate the active index based on scroll progress (midpoint switching)
          const progress = self.progress;
          const t = progress * (N - 1);
          const idx = Math.min(Math.max(Math.round(t), 0), N - 1);
          updateUI(idx);
        }
      }
    });

    // Build transitions for each pair of leaders
    for (let i = 0; i < N - 1; i++) {
      const currentLeader = leaders[i];
      const nextLeader = leaders[i + 1];

      const curMedia = currentLeader.querySelector('.gls-left-media');
      const curContent = currentLeader.querySelector('.gls-right-content');
      const nextMedia = nextLeader.querySelector('.gls-left-media');
      const nextContent = nextLeader.querySelector('.gls-right-content');

      // Segment duration variables (normalized timeline keys)
      const timeStart = i + 0.15;
      const timeEnd = i + 0.85;
      const duration = timeEnd - timeStart;

      // 1. Current Leader Exits (Image slides left, Content slides right)
      masterTl.set(currentLeader, { pointerEvents: 'none' }, timeStart);
      masterTl.to(currentLeader, {
        opacity: 0,
        duration: duration,
        ease: 'power2.inOut'
      }, timeStart);

      masterTl.to(curMedia, {
        x: -120,
        opacity: 0,
        scale: 0.95,
        duration: duration,
        ease: 'power2.inOut'
      }, timeStart);

      masterTl.to(curContent, {
        x: 120,
        opacity: 0,
        duration: duration,
        ease: 'power2.inOut'
      }, timeStart);

      // 2. Next Leader Enters (Image slides left->center, Content slides right->center)
      masterTl.set(nextLeader, { opacity: 1, pointerEvents: 'auto' }, timeStart);
      
      masterTl.fromTo(nextMedia, {
        x: -120,
        opacity: 0,
        scale: 0.95
      }, {
        x: 0,
        opacity: 1,
        scale: 1,
        duration: duration,
        ease: 'power2.inOut'
      }, timeStart);

      masterTl.fromTo(nextContent, {
        x: 120,
        opacity: 0
      }, {
        x: 0,
        opacity: 1,
        duration: duration,
        ease: 'power2.inOut'
      }, timeStart);
    }

    // Scroll Hint Fade-Out on initial scroll
    if (scrollHint) {
      gsap.to(scrollHint, {
        opacity: 0,
        y: 15,
        scrollTrigger: {
          trigger: outer,
          start: 'top+=50 top',
          end: 'top+=300 top',
          scrub: true
        }
      });
    }

    // Dot navigation setup
    let currentActive = 0;
    function updateUI(idx) {
      if (idx === currentActive) return;
      currentActive = idx;

      // Update counter text
      if (currentCounter) {
        currentCounter.textContent = String(idx + 1).padStart(2, '0');
      }

      // Update active state on progress dots
      dots.forEach((dot, dotIdx) => {
        dot.classList.toggle('gls-dot-active', dotIdx === idx);
      });
    }

    // Explicitly update dots at start
    if (dots.length > 0) dots[0].classList.add('gls-dot-active');

    // Force ScrollTrigger position refresh
    ScrollTrigger.refresh();
  }

  // Bind to window load to ensure images are loaded
  if (document.readyState === 'complete') {
    setTimeout(init, 50);
  } else {
    window.addEventListener('load', function () {
      setTimeout(init, 50);
    });
  }

})();
