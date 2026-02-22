'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  drift: number;
}

export function SparkCanvas() {
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

    const particles: Particle[] = [];
    const colors = ['#ff4d00', '#ff8c00', '#ffa500', '#ffd700', '#ffffff'];
    let rafId: number;

    function createParticle(): Particle {
      return {
        x: Math.random() * canvas!.width,
        y: canvas!.height + 10,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 2.5 + 0.8,
        opacity: Math.random() * 0.6 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: Math.random() * 2 - 1,
      };
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Add new spark particles
      if (particles.length < 120) {
        particles.push(createParticle());
      }

      // Update and draw sparks (on top of smoke)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // Move particle
        p.y -= p.speed;
        p.x += Math.sin(p.y / 30) * p.drift;

        // Fade out near top
        if (p.y < canvas!.height * 0.3) {
          p.opacity -= 0.01;
        }

        // Draw particle
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.opacity;

        // Add glow effect
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = p.color;
        ctx!.fillRect(p.x, p.y, p.size, p.size);
        ctx!.shadowBlur = 0;

        // Remove if off-screen or faded
        if (p.y < -10 || p.opacity <= 0) {
          particles.splice(i, 1);
        }
      }
      ctx!.globalAlpha = 1;

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
      style={{ zIndex: 5, background: 'transparent' }}
    />
  );
}
