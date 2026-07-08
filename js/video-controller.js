/* ═══════════════════════════════════════════════════════
   VIDEO-CONTROLLER.JS
   Ensures the hero logo video plays (autoplay fallback).
   The video loops continuously on the dark hero background.
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const heroLogo = document.getElementById('hero-logo');

    if (heroLogo) {
        // Ensure play is called programmatically (fallback for blocked autoplay)
        heroLogo.play().catch(() => {
            // Fallback: ensure opacity is shown even if autoplay blocked
            heroLogo.classList.add('active');
        });
    }
});
