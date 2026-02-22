'use client';

import { ReactNode } from 'react';

interface ModernBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function ModernBackground({ children, className = '' }: ModernBackgroundProps) {
  return (
    <div className={`relative min-h-screen bg-[#0a0a0a] ${className}`}>
      {/* Gradient Overlays */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(30, 30, 30, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(20, 20, 20, 0.5) 0%, transparent 50%),
            linear-gradient(
              180deg,
              rgba(10, 10, 10, 0.8) 0%,
              rgba(15, 15, 15, 0.6) 50%,
              rgba(10, 10, 10, 0.8) 100%
            )
          `,
        }}
      />
      {/* Hex grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0 L56 16 L56 50 L28 66 L0 50 L0 16 Z' fill='none' stroke='rgba(255,140,0,0.055)' stroke-width='1'/%3E%3Cpath d='M28 66 L56 82 L56 116 L28 132 L0 116 L0 82 Z' fill='none' stroke='rgba(255,140,0,0.055)' stroke-width='1'/%3E%3Cpath d='M56 16 L84 0' fill='none' stroke='rgba(255,140,0,0.055)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 100px',
          zIndex: 1,
        }}
      />

      {/* Noise/Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background: 'radial-gradient(circle, transparent 40%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
