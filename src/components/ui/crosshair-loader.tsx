'use client';

import { cn } from '@/lib/utils';

interface CrosshairLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-6 h-6', ring: 'border-[1.5px]', innerInset: 'inset-[4px]', svg: 'w-[10px] h-[10px]', text: 'text-xs' },
  md: { container: 'w-[60px] h-[60px]', ring: 'border-2', innerInset: 'inset-[8px]', svg: 'w-[22px] h-[22px]', text: 'text-sm' },
  lg: { container: 'w-[100px] h-[100px]', ring: 'border-2', innerInset: 'inset-[10px]', svg: 'w-9 h-9', text: 'text-base' },
};

export function CrosshairLoader({ size = 'md', message, className }: CrosshairLoaderProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn('relative flex items-center justify-center', s.container)}>
        {/* Outer ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-[crosshairSpin_1.5s_linear_infinite]',
            'border-transparent border-t-accent-primary border-r-accent-primary',
            s.ring
          )}
        />
        {/* Inner ring (reverse) */}
        <div
          className={cn(
            'absolute rounded-full animate-[crosshairSpin_2s_linear_infinite_reverse]',
            'border-transparent border-t-accent-primary/40 border-b-accent-primary/40',
            s.ring, s.innerInset
          )}
        />
        {/* Crosshair SVG */}
        <svg className={cn('relative z-[2]', s.svg)} viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="8" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="14" y1="1" x2="14" y2="8" stroke="var(--accent-primary)" strokeWidth="1.5" />
          <line x1="14" y1="20" x2="14" y2="27" stroke="var(--accent-primary)" strokeWidth="1.5" />
          <line x1="1" y1="14" x2="8" y2="14" stroke="var(--accent-primary)" strokeWidth="1.5" />
          <line x1="20" y1="14" x2="27" y2="14" stroke="var(--accent-primary)" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="2" fill="var(--accent-primary)" />
        </svg>
      </div>
      {message && (
        <span className={cn('text-text-secondary', s.text)}>{message}</span>
      )}
    </div>
  );
}
