import { useEffect } from "react";

export function useRandomDarkBackdrop() {
  useEffect(() => {
    const colorSchemes = [
      { h1: 210, h2: 140, h3: 275, a1: 0.14, a2: 0.10, a3: 0.08 },
      { h1: 195, h2: 120, h3: 260, a1: 0.12, a2: 0.08, a3: 0.06 },
      { h1: 230, h2: 160, h3: 290, a1: 0.16, a2: 0.12, a3: 0.10 },
      { h1: 200, h2: 130, h3: 280, a1: 0.13, a2: 0.09, a3: 0.07 },
      { h1: 220, h2: 150, h3: 300, a1: 0.15, a2: 0.11, a3: 0.09 },
      { h1: 190, h2: 110, h3: 250, a1: 0.11, a2: 0.07, a3: 0.05 },
      { h1: 240, h2: 170, h3: 310, a1: 0.17, a2: 0.13, a3: 0.11 },
      { h1: 180, h2: 100, h3: 240, a1: 0.10, a2: 0.06, a3: 0.04 },
      { h1: 250, h2: 180, h3: 320, a1: 0.18, a2: 0.14, a3: 0.12 },
      { h1: 205, h2: 135, h3: 270, a1: 0.14, a2: 0.10, a3: 0.08 },
    ];

    const root = document.documentElement;
    if (!root) return;

    let currentSchemeIndex = Math.floor(Math.random() * colorSchemes.length);
    let scheme = colorSchemes[currentSchemeIndex];

    const applyScheme = () => {
      root.style.setProperty("--bg-h1", `${scheme.h1}`);
      root.style.setProperty("--bg-h2", `${scheme.h2}`);
      root.style.setProperty("--bg-h3", `${scheme.h3}`);
      root.style.setProperty("--bg-a1", `${scheme.a1}`);
      root.style.setProperty("--bg-a2", `${scheme.a2}`);
      root.style.setProperty("--bg-a3", `${scheme.a3}`);

      root.style.setProperty("--bg-color-1", `hsla(${scheme.h1}, 85%, 60%, ${scheme.a1})`);
      root.style.setProperty("--bg-color-2", `hsla(${scheme.h2}, 90%, 65%, ${scheme.a2})`);
      root.style.setProperty("--bg-color-3", `hsla(${scheme.h3}, 80%, 70%, ${scheme.a3})`);
      root.style.setProperty("--bg-color-4", `hsla(${scheme.h1 + 20}, 85%, 55%, ${scheme.a1 * 0.8})`);
      root.style.setProperty("--bg-color-5", `hsla(${scheme.h2 + 30}, 90%, 65%, ${scheme.a2 * 0.9})`);
      root.style.setProperty("--bg-color-6", `hsla(${scheme.h3 - 10}, 75%, 60%, ${scheme.a3 * 0.7})`);
    };

    applyScheme();

    let animationId;
    const handleMouseMove = (e) => {
      const particles = document.getElementById('particles');
      if (particles) {
        const x = e.clientX;
        const y = e.clientY;
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
          particles.style.setProperty('--mouse-x', `${x}px`);
          particles.style.setProperty('--mouse-y', `${y}px`);
        });
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
          const particles = document.getElementById('particles');
          if (particles) {
            particles.style.setProperty('--mouse-x', `${x}px`);
            particles.style.setProperty('--mouse-y', `${y}px`);
          }
        });
      }
    };

    const handleResize = () => {
      applyScheme();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      root.style.removeProperty("--bg-h1");
      root.style.removeProperty("--bg-h2");
      root.style.removeProperty("--bg-h3");
      root.style.removeProperty("--bg-a1");
      root.style.removeProperty("--bg-a2");
      root.style.removeProperty("--bg-a3");
    };
  }, []);
}
