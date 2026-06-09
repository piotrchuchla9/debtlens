import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const trendColor = delta === null || delta === 0 ? 'text-muted-foreground' : delta > 0 ? 'text-red-500' : 'text-green-500';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Dead Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <span className={cn('text-4xl font-bold tabular-nums', healthColor(total))}>
            {formatNumber(total)}
          </span>
          {delta !== null && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>{delta > 0 ? `+${delta}` : delta}</span>
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
          <div>
            <div className="font-semibold text-foreground">{files}</div>
            <div>files</div>
          </div>
          <div>
            <div className="font-semibold text-foreground">{exports}</div>
            <div>exports</div>
          </div>
          <div>
            <div className="font-semibold text-foreground">{deps}</div>
            <div>deps</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
