'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings, GitBranch, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface RepoHeaderProps {
  repo: { id: string; full_name: string; default_branch: string };
  latestJob: { id: string; status: string; triggered_at: string; commit_sha: string } | null;
  repoId: string;
}

export function RepoHeader({ repo, latestJob, repoId }: RepoHeaderProps) {
  const [scanning, setScanning] = useState(false);

  async function triggerScan() {
    setScanning(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/scan`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to trigger scan');
      } else {
        toast.success('Scan queued — results will appear in a moment');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setScanning(false);
    }
  }

  const statusColor = {
    completed: 'bg-green-500',
    running: 'bg-yellow-500 animate-pulse',
    pending: 'bg-yellow-500 animate-pulse',
    failed: 'bg-red-500',
    dead: 'bg-red-500',
  }[latestJob?.status ?? 'completed'] ?? 'bg-muted';

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{repo.full_name}</h1>
          <a
            href={`https://github.com/${repo.full_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            {repo.default_branch}
          </span>
          {latestJob && (
            <>
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                {latestJob.status}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(latestJob.triggered_at)}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerScan}
          disabled={scanning || latestJob?.status === 'running' || latestJob?.status === 'pending'}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          Scan Now
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/repo/${repoId}/settings`}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
