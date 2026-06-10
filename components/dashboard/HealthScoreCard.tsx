import { TrendingDown, TrendingUp, Minus, FileX, FunctionSquare, PackageX } from 'lucide-react';
import { cn, formatNumber, healthColor } from '@/lib/utils';

interface HealthScoreCardProps {
  total: number;
  delta: number | null;
  files: number;
  exports: number;
  deps: number;
}

export function HealthScoreCard({ total, delta, files, exports, deps }: HealthScoreCardProps) {
  const isNeutral = delta === null || delta === 0;
  const isGood = delta !== null && delta < 0;

  const TrendIcon = isNeutral ? Minus : isGood ? TrendingDown : TrendingUp;
  const trendClass = isNeutral
    ? 'text-muted-foreground bg-muted/60'
    : isGood
    ? 'text-green-500 bg-green-500/10'
    : 'text-red-500 bg-red-500/10';

  const stats = [
    { label: 'Files',   value: files,   icon: FileX },
    { label: 'Exports', value: exports, icon: FunctionSquare },
    { label: 'Deps',    value: deps,    icon: PackageX },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Total dead code</span>
        {delta !== null && (
          <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', trendClass)}>
            <TrendIcon className="h-3 w-3" />
            {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
          </div>
        )}
      </div>

      <div className={cn('mt-3 text-6xl font-bold tabular-nums tracking-tight', healthColor(total))}>
        {formatNumber(total)}
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-border/60">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col items-center gap-1 px-2 first:pl-0 last:pr-0">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Icon className="h-3 w-3" />
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
