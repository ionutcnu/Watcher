import { cn } from '@/lib/utils';

interface CamoDividerProps {
  className?: string;
}

export function CamoDivider({ className }: CamoDividerProps) {
  return <div className={cn('camo-divider my-6', className)} />;
}
