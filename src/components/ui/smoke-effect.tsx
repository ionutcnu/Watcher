'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export function SmokeEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Key blending mode for realistic smoke
    ctx.globalCompositeOperation = 'screen';

    const particles: Particle[] = [];
    const maxParticles = 40; // Reduced for subtlety
    let rafId: number;

    // Emit particles from bottom
    function createParticle(): Particle {
      const x = Math.random() * canvas!.width;
      const y = canvas!.height + 50;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8, // Slower horizontal drift
        vy: -(Math.random() * 1 + 0.5),   // Slower rise speed
        life: 0,
        maxLife: Math.random() * 150 + 120, // Longer life
        size: Math.random() * 100 + 80, // Larger, more diffuse
      };
    }

    function animate() {
      // Darker fill for more fade
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.fillStyle = 'rgba(10, 10, 10, 0.15)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx!.globalCompositeOperation = 'screen';

      // Add new particles from bottom (slower emission)
      if (particles.length < maxParticles && Math.random() > 0.3) {
        particles.push(createParticle());
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Slow down as it rises
        p.vy *= 0.99;
        p.vx *= 0.99;

        // Calculate opacity (fade in then out)
        const lifePercent = p.life / p.maxLife;
        let opacity;
        if (lifePercent < 0.2) {
          opacity = lifePercent * 5 * 0.08; // Fade in
        } else {
          opacity = (1 - lifePercent) * 0.08; // Fade out - very subtle
        }

        // Expand size as it rises
        const currentSize = p.size * (1 + lifePercent * 1.2);

        // Draw smoke particle with heavy blur
        ctx!.shadowBlur = 40;
        ctx!.shadowColor = 'rgba(30, 30, 30, 0.3)';

        const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize / 2);

        // Very dark gray smoke
        const gray = 15 + Math.random() * 10;
        gradient.addColorStop(0, `rgba(${gray}, ${gray}, ${gray}, ${opacity})`);
        gradient.addColorStop(0.4, `rgba(${gray + 5}, ${gray + 5}, ${gray + 5}, ${opacity * 0.6})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, currentSize / 2, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.shadowBlur = 0;

        // Remove dead particles
        if (p.life >= p.maxLife || p.y < -100) {
          particles.splice(i, 1);
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
