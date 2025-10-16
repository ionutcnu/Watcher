'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TacticalLoaderProps {
  variant?: 'shell' | 'turret' | 'spinner';
  color?: 'green' | 'amber' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function TacticalLoader({
  variant = 'shell',
  color = 'green',
  size = 'md',
  message,
  className
}: TacticalLoaderProps) {
  const colorMap = {
    green: { primary: 'var(--hud-green)', glow: 'var(--glow-green)' },
    amber: { primary: 'var(--hud-amber)', glow: 'var(--glow-amber)' },
    cyan: { primary: 'var(--hud-cyan)', glow: 'rgba(0, 255, 255, 0.5)' }
  };

  const sizeMap = {
    sm: { container: 'h-3', spinner: 'w-8 h-8', text: 'text-xs' },
    md: { container: 'h-4', spinner: 'w-12 h-12', text: 'text-sm' },
    lg: { container: 'h-6', spinner: 'w-16 h-16', text: 'text-base' }
  };

  const colors = colorMap[color];
  const sizes = sizeMap[size];

  if (variant === 'shell') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {/* Shell loading bar */}
        <div
          className={cn('relative w-24 rounded-full overflow-hidden bg-gray-900', sizes.container)}
          style={{
            border: `2px solid ${colors.primary}`,
            boxShadow: `0 0 10px ${colors.glow}`
          }}
        >
          <motion.div
            className="absolute h-full"
            style={{
              background: `linear-gradient(90deg, ${colors.primary} 0%, var(--rust-orange) 50%, var(--target-red) 100%)`
            }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '50% 100%'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%']
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        {/* Loading text */}
        {message && (
          <span
            className={cn('font-mono font-bold uppercase tracking-wider', sizes.text)}
            style={{
              color: colors.primary,
              textShadow: `0 0 10px ${colors.glow}`
            }}
          >
            {message}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'turret') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        {/* Turret rotation */}
        <motion.div
          className={cn('rounded-full', sizes.spinner)}
          style={{
            border: `4px solid var(--military-gray)`,
            borderTopColor: colors.primary,
            boxShadow: `0 0 20px ${colors.glow}`
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {message && (
          <span
            className={cn('font-mono font-bold uppercase tracking-wider', sizes.text)}
            style={{
              color: colors.primary,
              textShadow: `0 0 10px ${colors.glow}`
            }}
          >
            {message}
          </span>
        )}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Tactical spinner with crosshair */}
      <div className={cn('relative', sizes.spinner)}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid ${colors.primary}`,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            boxShadow: `0 0 15px ${colors.glow}`
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Inner ring (opposite direction) */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            border: `2px solid ${colors.primary}`,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            opacity: 0.6
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Center crosshair */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 0 10px ${colors.glow}`
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>

      {message && (
        <span
          className={cn('font-mono font-bold uppercase tracking-wider', sizes.text)}
          style={{
            color: colors.primary,
            textShadow: `0 0 10px ${colors.glow}`
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
