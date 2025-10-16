'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedGradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group relative mx-auto flex max-w-fit flex-row items-center justify-center',
        className
      )}
    >
      <span
        className={cn(
          `inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
          'text-4xl font-bold'
        )}
        style={{
          '--bg-size': '300%',
        } as React.CSSProperties}
      >
        {children}
      </span>
      <style jsx>{`
        @keyframes gradient {
          to {
            background-position: var(--bg-size) 0;
          }
        }
        .animate-gradient {
          animation: gradient 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
