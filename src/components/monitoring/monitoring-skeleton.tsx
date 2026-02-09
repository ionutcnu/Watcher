import { Skeleton } from '@/components/ui/skeleton';

export function MonitoringSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-10 w-72 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-40 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </div>
      </div>

      {/* Clans table skeleton */}
      <div className="bg-surface rounded-lg border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-border/40 last:border-0">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-7 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Clan + Bulk Import skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg border border-border p-6">
          <Skeleton className="h-6 w-56 mb-4" />
          <Skeleton className="h-10 w-full rounded-md mb-4" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
        <div className="bg-surface rounded-lg border border-border p-6">
          <Skeleton className="h-6 w-44 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>
    </div>
  );
}
