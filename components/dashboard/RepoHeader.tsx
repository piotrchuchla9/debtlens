'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings, GitBranch, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface RepoHeaderProps {
  repo: { id: string; full_name: string; default_branch: string };
  latestJob: { id: string; status: string; triggered_at: string; commit_sha: string } | null;
  repoId: string;
}

const statusConfig = {
  completed: { label: 'Ready', className: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20' },
  running:   { label: 'Running', className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 animate-pulse' },
  pending:   { label: 'Queued', className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 animate-pulse' },
  failed:    { label: 'Failed', className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20' },
  dead:      { label: 'Dead', className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20' },
} as const;

export function RepoHeader({ repo, latestJob, repoId }: RepoHeaderProps) {
  const [scanning, setScanning] = useState(false);
  const status = latestJob?.status as keyof typeof statusConfig | undefined;
  const statusCfg = status ? statusConfig[status] : null;
  const isProcessing = status === 'running' || status === 'pending';

  async function triggerScan() {
    setScanning(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/scan`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? 'Failed to trigger scan');
      else toast.success('Scan queued — results will appear shortly');
    } catch {
      toast.error('Network error');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{repo.full_name}</h1>
          <a
            href={`https://github.com/${repo.full_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          {statusCfg && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              {statusCfg.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            {repo.default_branch}
          </span>
          {latestJob && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(latestJob.triggered_at)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          onClick={triggerScan}
          disabled={scanning || isProcessing}
        >
          {scanning || isProcessing
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5" />
          }
          Scan Now
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/repo/${repoId}/settings`}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
