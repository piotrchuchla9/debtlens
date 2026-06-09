import Link from 'next/link';
import { GitBranch, Clock, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RepositoryWithLatestAnalysis } from '@/types';
import { cn, formatDate, healthColor } from '@/lib/utils';

interface RepoCardProps {
  repo: RepositoryWithLatestAnalysis;
}

export function RepoCard({ repo }: RepoCardProps) {
  const total = repo.latest_analysis?.total_dead_code ?? null;
  const status = repo.latest_job?.status;
  const isProcessing = status === 'running' || status === 'pending';
  const isFailed = status === 'failed' || status === 'dead';

  return (
    <Link href={`/repo/${repo.id}`} className="group block">
      <div className="relative h-full rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-border hover:shadow-md dark:hover:shadow-black/20">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{repo.full_name}</p>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span>{repo.default_branch}</span>
            </div>
          </div>

          {isProcessing && (
            <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scanning
            </Badge>
          )}
          {isFailed && (
            <Badge variant="destructive" className="shrink-0 gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              Failed
            </Badge>
          )}
        </div>

        {/* Score */}
        <div className="mt-4">
          {total !== null ? (
            <div className={cn('text-4xl font-bold tabular-nums tracking-tight', healthColor(total))}>
              {total}
            </div>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground/40">—</div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">dead code items</div>
        </div>

        {/* Footer */}
        {repo.latest_analysis && (
          <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(repo.latest_analysis.created_at)}</span>
          </div>
        )}
        {!repo.latest_analysis && !isProcessing && (
          <div className="mt-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            No scans yet
          </div>
        )}
      </div>
    </Link>
  );
}
