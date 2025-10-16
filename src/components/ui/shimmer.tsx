'use client';

import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export function Shimmer({
  className,
  shimmerColor = '#8b5cf6',
  shimmerSize = '0.05em',
  borderRadius = '0.5em',
  shimmerDuration = '3s',
  background = 'rgba(0, 0, 0, 0.3)',
}: ShimmerProps) {
  return (
    <div
      style={
        {
          '--shimmer-color': shimmerColor,
          '--shimmer-size': shimmerSize,
          '--border-radius': borderRadius,
          '--shimmer-duration': shimmerDuration,
          '--background': background,
        } as CSSProperties
      }
      className={cn(
        'relative overflow-hidden',
        // before styles
        "before:absolute before:inset-0",
        "before:translate-x-[-100%]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-[var(--shimmer-color)] before:to-transparent",
        "before:animate-[shimmer_var(--shimmer-duration)_infinite]",
        className
      )}
    >
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
