/* ================================================================
   Animated blueprint-style particle network background.
   Reads --bg / --accent from CSS so it follows the active theme.
   ================================================================ */

(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let particles = [];
  const LINK_DIST = 105;
  const PARTICLE_COUNT_BASE = 40; // for a ~1400px wide viewport, scales with area

  const mouse = { x: null, y: null, active: false };

  function themeColor(varName, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || fallback;
  }

  function hexToRgbParts(hex) {
    const h = hex.replace('#', '');
    if (h.length !== 6) return { r: 255, g: 159, b: 67 };
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function initParticles() {
    const area = width * height;
    const count = Math.round(PARTICLE_COUNT_BASE * (area / (1400 * 800)));
    const target = Math.max(20, Math.min(65, count));
    particles = [];
    for (let i = 0; i < target; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6
      });
    }
  }

  function step() {
    const accentHex = themeColor('--accent', '#ff9f43');
    const accent = hexToRgbParts(accentHex);

    ctx.clearRect(0, 0, width, height);

    // update + draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (!reduceMotion) {
        p.x += p.vx;
        p.y += p.vy;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0.01) {
            const force = (120 - dist) / 120 * 0.03;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // gentle speed damping so it doesn't run away
        p.vx *= 0.995;
        p.vy *= 0.995;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.45)`;
      ctx.fill();
    }

    // connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (!reduceMotion) {
      requestAnimationFrame(step);
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  resize();
  step();
})();