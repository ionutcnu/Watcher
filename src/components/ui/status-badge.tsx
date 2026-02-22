'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface StatusBadgeProps {
  text?: string;
  variant?: 'active' | 'inactive';
}

export function StatusBadge({ text = 'Real-time monitoring active' }: StatusBadgeProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[rgba(30,30,30,0.75)] border border-[#FF8C00]/30 backdrop-blur-[12px]"
    >
      <motion.div
        animate={prefersReducedMotion ? undefined : {
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-2 h-2 rounded-full bg-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.5)]"
      />
      <span className="text-sm font-medium text-[#FF8C00]">{text}</span>
    </motion.div>
  );
}
