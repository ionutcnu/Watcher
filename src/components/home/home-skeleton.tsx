import { Skeleton } from '@/components/ui/skeleton';

export function HomeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero */}
      <div className="mb-12 text-center">
        <Skeleton className="h-14 w-96 mx-auto mb-4" />
        <Skeleton className="h-5 w-80 mx-auto mb-8" />
        <Skeleton className="h-11 w-44 mx-auto rounded-lg" />
      </div>

      {/* Search card skeleton */}
      <div className="bg-surface rounded-xl border border-accent-primary/20 py-6 mb-8 shadow-[0_0_16px_rgba(59,130,246,0.05)]">
        <div className="px-6 mb-4">
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="px-6 space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Recent changes skeleton */}
      <div className="bg-surface rounded-xl border border-border py-6">
        <div className="px-6 flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="px-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
