'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberTicker } from './number-ticker';

interface StatCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  delay?: number;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon,
  delay = 0,
  className = '',
  trend
}: StatCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] // Ease-out-cubic
      }}
      className={className}
    >
      <Card className="border-border/40 bg-surface/50 backdrop-blur-sm hover:bg-surface/80 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-text-secondary">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-accent-primary">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold text-text-primary font-mono">
              <NumberTicker value={value} />
            </div>
            {trend && (
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
