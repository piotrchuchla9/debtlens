import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn, formatNumber, healthColor } from '@/lib/utils';

interface HealthScoreCardProps {
  total: number;
  delta: number | null;
  files: number;
  exports: number;
  deps: number;
}

export function HealthScoreCard({ total, delta, files, exports, deps }: HealthScoreCardProps) {
  const TrendIcon = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const trendColor = delta === null || delta === 0
    ? 'text-muted-foreground bg-muted'
    : delta > 0
    ? 'text-red-500 bg-red-500/10'
    : 'text-green-500 bg-green-500/10';

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Total Dead Code
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className={cn('text-5xl font-bold tabular-nums tracking-tight', healthColor(total))}>
          {formatNumber(total)}
        </span>

        {delta !== null && (
          <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{delta > 0 ? `+${delta}` : delta === 0 ? '0' : delta}</span>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: 'Files', value: files, color: 'text-orange-500' },
          { label: 'Exports', value: exports, color: 'text-blue-500' },
          { label: 'Deps', value: deps, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
            <div className={cn('text-xl font-bold tabular-nums', color)}>{value}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
