'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RadarSweepProps {
  size?: number;
  activity?: number;
  color?: 'green' | 'cyan' | 'amber';
  className?: string;
}

interface Blip {
  id: number;
  x: number;
  y: number;
  intensity: number;
}

export function RadarSweep({
  size = 256,
  activity = 0,
  color = 'cyan',
  className
}: RadarSweepProps) {
  const colorMap = {
    green: {
      primary: 'var(--hud-green)',
      glow: 'var(--glow-green)'
    },
    cyan: {
      primary: 'var(--hud-cyan)',
      glow: 'rgba(0, 255, 255, 0.5)'
    },
    amber: {
      primary: 'var(--hud-amber)',
      glow: 'var(--glow-amber)'
    }
  };

  const colors = colorMap[color];

  // Generate random blips based on activity level
  const blips: Blip[] = Array.from({ length: Math.min(activity, 10) }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    intensity: 0.5 + Math.random() * 0.5
  }));

  return (
    <div
      className={cn('relative rounded-full', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `4px solid ${colors.primary}`,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        boxShadow: `0 0 30px ${colors.glow}, inset 0 0 30px rgba(0, 0, 0, 0.8)`
      }}
    >
      {/* Horizontal crosshair */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          borderTop: `1px solid ${colors.primary}`,
          opacity: 0.3
        }}
      />

      {/* Vertical crosshair */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          borderLeft: `1px solid ${colors.primary}`,
          opacity: 0.3
        }}
      />

      {/* Concentric circles */}
      {[25, 50, 75, 100].map((percentage) => (
        <div
          key={percentage}
          className="absolute rounded-full"
          style={{
            width: `${percentage}%`,
            height: `${percentage}%`,
            top: `${(100 - percentage) / 2}%`,
            left: `${(100 - percentage) / 2}%`,
            border: `1px solid ${colors.primary}`,
            opacity: 0.2
          }}
        />
      ))}

      {/* Sweep effect */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `conic-gradient(
            from 0deg at 50% 50%,
            ${colors.primary}00 0deg,
            ${colors.primary}80 30deg,
            ${colors.primary}00 60deg
          )`
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Center indicator */}
      <motion.div
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: colors.primary,
          boxShadow: `0 0 15px ${colors.glow}`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Activity blips */}
      {blips.map((blip) => (
        <motion.div
          key={blip.id}
          className="absolute rounded-full"
          style={{
            width: '8px',
            height: '8px',
            left: `${blip.x}%`,
            top: `${blip.y}%`,
            backgroundColor: 'var(--target-red)',
            boxShadow: '0 0 10px var(--glow-red)',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [blip.intensity, 0.3, blip.intensity]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: blip.id * 0.2
          }}
        />
      ))}

      {/* Corner brackets for HUD feel */}
      <div className="absolute inset-0">
        {/* Top-left */}
        <div
          className="absolute top-2 left-2 w-6 h-6"
          style={{
            borderTop: `2px solid ${colors.primary}`,
            borderLeft: `2px solid ${colors.primary}`
          }}
        />
        {/* Top-right */}
        <div
          className="absolute top-2 right-2 w-6 h-6"
          style={{
            borderTop: `2px solid ${colors.primary}`,
            borderRight: `2px solid ${colors.primary}`
          }}
        />
        {/* Bottom-left */}
        <div
          className="absolute bottom-2 left-2 w-6 h-6"
          style={{
            borderBottom: `2px solid ${colors.primary}`,
            borderLeft: `2px solid ${colors.primary}`
          }}
        />
        {/* Bottom-right */}
        <div
          className="absolute bottom-2 right-2 w-6 h-6"
          style={{
            borderBottom: `2px solid ${colors.primary}`,
            borderRight: `2px solid ${colors.primary}`
          }}
        />
      </div>

      {/* Activity counter */}
      <div
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-mono font-bold"
        style={{
          color: colors.primary,
          textShadow: `0 0 10px ${colors.glow}`
        }}
      >
        ACTIVITY: {activity}
      </div>
    </div>
  );
}
