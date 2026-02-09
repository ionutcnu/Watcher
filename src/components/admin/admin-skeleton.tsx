import { Skeleton } from '@/components/ui/skeleton';

export function AdminSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Settings card skeleton */}
      <div className="bg-surface rounded-xl border border-border py-6 mb-8">
        <div className="px-6 mb-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="px-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Create user skeleton */}
      <div className="bg-surface-elevated rounded-xl border border-border py-6 mb-8">
        <div className="px-6 flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Users table skeleton */}
      <div className="bg-surface rounded-xl border border-border py-6">
        <div className="px-6 mb-4">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="px-6 space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 py-4 border-b border-border/40 last:border-0">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-40 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
