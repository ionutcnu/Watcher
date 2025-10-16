'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ArmorBarProps {
  value: number;
  max: number;
  label: string;
  color?: 'green' | 'amber' | 'red';
  segments?: number;
  showValues?: boolean;
  className?: string;
  animated?: boolean;
}

export function ArmorBar({
  value,
  max,
  label,
  color = 'green',
  segments = 10,
  showValues = true,
  className,
  animated = true
}: ArmorBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorMap = {
    green: {
      bg: 'var(--hud-green)',
      border: 'var(--hud-green)',
      glow: 'var(--glow-green)',
      text: 'var(--hud-green)'
    },
    amber: {
      bg: 'var(--hud-amber)',
      border: 'var(--hud-amber)',
      glow: 'var(--glow-amber)',
      text: 'var(--hud-amber)'
    },
    red: {
      bg: 'var(--target-red)',
      border: 'var(--target-red)',
      glow: 'var(--glow-red)',
      text: 'var(--target-red)'
    }
  };

  const colors = colorMap[color];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and values */}
      <div className="flex justify-between items-center text-xs font-mono">
        <span
          className="uppercase tracking-wider"
          style={{
            color: colors.text,
            textShadow: `0 0 10px ${colors.glow}`
          }}
        >
          ► {label}
        </span>
        {showValues && (
          <span
            className="font-bold"
            style={{
              color: colors.text,
              textShadow: `0 0 10px ${colors.glow}`
            }}
          >
            {value}/{max}
          </span>
        )}
      </div>

      {/* Armor bar container */}
      <div
        className="relative h-8 bg-black/50"
        style={{
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 10px ${colors.glow}, inset 0 0 10px rgba(0, 0, 0, 0.5)`
        }}
      >
        {/* Filled portion with gradient */}
        <motion.div
          className="absolute h-full"
          style={{
            background: `linear-gradient(90deg, ${colors.bg} 0%, ${colors.bg}cc 50%, ${colors.bg} 100%)`,
            boxShadow: `0 0 20px ${colors.glow}`
          }}
          initial={{ width: 0 }}
          animate={animated ? { width: `${percentage}%` } : {}}
          transition={{
            duration: 1,
            ease: "easeOut"
          }}
        />

        {/* Animated shine effect */}
        {animated && percentage > 0 && (
          <motion.div
            className="absolute h-full w-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
              backgroundSize: '50% 100%'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}

        {/* Segment dividers */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                borderRight: i < segments - 1 ? '1px solid rgba(0, 0, 0, 0.5)' : 'none'
              }}
            />
          ))}
        </div>

        {/* Percentage text overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold"
          style={{
            color: percentage > 50 ? 'var(--military-dark)' : colors.text,
            textShadow: percentage > 50 ? 'none' : `0 0 10px ${colors.glow}`,
            mixBlendMode: percentage > 50 ? 'normal' : 'screen'
          }}
        >
          {Math.round(percentage)}%
        </div>

        {/* Metallic texture overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #ffffff 2px, #ffffff 4px)',
            mixBlendMode: 'overlay'
          }}
        />
      </div>
    </div>
  );
}
