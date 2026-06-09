import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RepositoryWithLatestAnalysis } from '@/types';
import { cn, formatDate, healthColor } from '@/lib/utils';

interface RepoCardProps {
  repo: RepositoryWithLatestAnalysis;
}

export function RepoCard({ repo }: RepoCardProps) {
  const total = repo.latest_analysis?.total_dead_code ?? null;
  const status = repo.latest_job?.status;

  const statusBadge = status === 'running' || status === 'pending'
    ? <Badge variant="secondary" className="animate-pulse">Scanning...</Badge>
    : status === 'failed' || status === 'dead'
    ? <Badge variant="destructive">Failed</Badge>
    : null;

  return (
    <Link href={`/repo/${repo.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium">{repo.full_name}</CardTitle>
            {statusBadge}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            {repo.default_branch}
          </div>
        </CardHeader>
        <CardContent>
          {total !== null ? (
            <div className={cn('text-3xl font-bold tabular-nums', healthColor(total))}>{total}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No scans yet</div>
          )}
          {repo.latest_analysis && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(repo.latest_analysis.created_at)}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
