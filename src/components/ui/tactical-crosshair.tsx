'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TacticalCrosshairProps {
  size?: number;
  color?: 'green' | 'amber' | 'red' | 'cyan';
  animated?: boolean;
  className?: string;
}

export function TacticalCrosshair({
  size = 128,
  color = 'green',
  animated = true,
  className
}: TacticalCrosshairProps) {
  const colorMap = {
    green: 'var(--hud-green)',
    amber: 'var(--hud-amber)',
    red: 'var(--target-red)',
    cyan: 'var(--hud-cyan)'
  };

  const glowColorMap = {
    green: 'var(--glow-green)',
    amber: 'var(--glow-amber)',
    red: 'var(--glow-red)',
    cyan: 'rgba(0, 255, 255, 0.5)'
  };

  const selectedColor = colorMap[color];
  const selectedGlow = glowColorMap[color];
  const lineLength = size * 0.25;
  const lineWidth = 2;
  const bracketSize = size * 0.1875; // 24px for 128px

  return (
    <div
      className={cn('relative', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {/* Center dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: `${lineWidth * 2}px`,
          height: `${lineWidth * 2}px`,
          backgroundColor: selectedColor,
          boxShadow: `0 0 10px ${selectedGlow}`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={animated ? {
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Top line */}
      <div
        className="absolute top-0 left-1/2"
        style={{
          width: `${lineWidth}px`,
          height: `${lineLength}px`,
          backgroundColor: selectedColor,
          boxShadow: `0 0 5px ${selectedGlow}`,
          transform: 'translateX(-50%)'
        }}
      />

      {/* Bottom line */}
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          width: `${lineWidth}px`,
          height: `${lineLength}px`,
          backgroundColor: selectedColor,
          boxShadow: `0 0 5px ${selectedGlow}`,
          transform: 'translateX(-50%)'
        }}
      />

      {/* Left line */}
      <div
        className="absolute top-1/2 left-0"
        style={{
          width: `${lineLength}px`,
          height: `${lineWidth}px`,
          backgroundColor: selectedColor,
          boxShadow: `0 0 5px ${selectedGlow}`,
          transform: 'translateY(-50%)'
        }}
      />

      {/* Right line */}
      <div
        className="absolute top-1/2 right-0"
        style={{
          width: `${lineLength}px`,
          height: `${lineWidth}px`,
          backgroundColor: selectedColor,
          boxShadow: `0 0 5px ${selectedGlow}`,
          transform: 'translateY(-50%)'
        }}
      />

      {/* Top-left corner bracket */}
      <div
        className="absolute"
        style={{
          top: `${bracketSize}px`,
          left: `${bracketSize}px`,
          width: `${bracketSize}px`,
          height: `${bracketSize}px`,
          borderTop: `${lineWidth}px solid ${selectedColor}`,
          borderLeft: `${lineWidth}px solid ${selectedColor}`,
          boxShadow: `0 0 5px ${selectedGlow}`
        }}
      />

      {/* Top-right corner bracket */}
      <div
        className="absolute"
        style={{
          top: `${bracketSize}px`,
          right: `${bracketSize}px`,
          width: `${bracketSize}px`,
          height: `${bracketSize}px`,
          borderTop: `${lineWidth}px solid ${selectedColor}`,
          borderRight: `${lineWidth}px solid ${selectedColor}`,
          boxShadow: `0 0 5px ${selectedGlow}`
        }}
      />

      {/* Bottom-left corner bracket */}
      <div
        className="absolute"
        style={{
          bottom: `${bracketSize}px`,
          left: `${bracketSize}px`,
          width: `${bracketSize}px`,
          height: `${bracketSize}px`,
          borderBottom: `${lineWidth}px solid ${selectedColor}`,
          borderLeft: `${lineWidth}px solid ${selectedColor}`,
          boxShadow: `0 0 5px ${selectedGlow}`
        }}
      />

      {/* Bottom-right corner bracket */}
      <div
        className="absolute"
        style={{
          bottom: `${bracketSize}px`,
          right: `${bracketSize}px`,
          width: `${bracketSize}px`,
          height: `${bracketSize}px`,
          borderBottom: `${lineWidth}px solid ${selectedColor}`,
          borderRight: `${lineWidth}px solid ${selectedColor}`,
          boxShadow: `0 0 5px ${selectedGlow}`
        }}
      />

      {/* Animated scanning line */}
      {animated && (
        <motion.div
          className="absolute left-0 w-full"
          style={{
            height: `${lineWidth}px`,
            backgroundColor: selectedColor,
            opacity: 0.3,
            boxShadow: `0 0 10px ${selectedGlow}`
          }}
          animate={{
            top: ['0%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {/* Rotating outer ring */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px dashed ${selectedColor}`,
            opacity: 0.3
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </div>
  );
}
