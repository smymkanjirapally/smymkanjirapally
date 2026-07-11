'use strict';

(function () {
  const gallery = document.getElementById('gallery');
  const grid = document.getElementById('moments-grid');
  if (!gallery || !grid) return;

  const header = gallery.querySelector('.moments-header');
  const cards = Array.from(grid.querySelectorAll('.moments-card'));
  if (cards.length === 0) return;

  // 1. Scroll-Entrance reveal observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate header entrance
        if (header) {
          header.classList.add('entered');
        }
        
        // Stagger bento cards entrance
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.add('entered');
          }, i * 85); // Premium 85ms cascade delay
        });
        
        observer.unobserve(gallery);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(gallery);

  // 2. Apple-inspired 3D Tilt & Parallax mouse tracking (Desktop only for performance)
  const isDesktop = () => window.innerWidth > 1024;

  cards.forEach(card => {
    const img = card.querySelector('img');
    if (!img) return;

    card.addEventListener('mousemove', (e) => {
      if (!isDesktop()) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // mouse x inside card
      const y = e.clientY - rect.top;  // mouse y inside card
      
      const w = rect.width;
      const h = rect.height;

      // Calculate tilt limits (+/- 7 degrees max)
      const tiltX = ((y / h) - 0.5) * -14; 
      const tiltY = ((x / w) - 0.5) * 14;

      // Calculate image offset limits (+/- 8px max offset in opposite direction)
      const imgX = ((x / w) - 0.5) * -12;
      const imgY = ((y / h) - 0.5) * -12;

      // Disable transition timings during active mouse movements for zero-latency tracking
      card.style.transition = 'opacity 0.85s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease';
      img.style.transition = 'none';

      // Apply GPU-accelerated transforms
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px) scale(1.025)`;
      img.style.transform = `scale(1.08) translate3d(${imgX}px, ${imgY}px, 0)`;
    });

    card.addEventListener('mouseleave', () => {
      // Re-enable smooth transition timings when resetting card position
      card.style.transition = 'opacity 0.85s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease';
      img.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';

      // Reset card transforms
      card.style.transform = '';
      img.style.transform = '';
    });
  });

})();
