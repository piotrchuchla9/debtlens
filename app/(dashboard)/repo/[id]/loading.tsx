import { Skeleton } from '@/components/ui/skeleton';

export default function RepoLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-xl" />
        <div className="lg:col-span-2">
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>

      {/* Chart */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
