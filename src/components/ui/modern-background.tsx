'use client';

import { ReactNode } from 'react';

interface ModernBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function ModernBackground({ children, className = '' }: ModernBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {children}
    </div>
  );
}
