'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DotsBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  dotSize?: number;
  dotColor?: string;
  backgroundColor?: string;
}

export function DotsBackground({
  children,
  className,
  dotSize = 1,
  dotColor = '#4a5568',
  backgroundColor = '#0a0e1a',
}: DotsBackgroundProps) {
  const dotStyle = {
    backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
    backgroundSize: '30px 30px',
    backgroundColor,
  };

  return (
    <div className={cn('relative w-full h-full', className)} style={dotStyle}>
      {children}
    </div>
  );
}
