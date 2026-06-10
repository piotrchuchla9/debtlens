'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, GitBranch, Clock, ExternalLink, Loader2, Download, Cpu, Database, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface RepoHeaderProps {
  repo: { id: string; full_name: string; default_branch: string; scan_branch: string | null };
  latestJob: { id: string; status: string; triggered_at: string; commit_sha: string } | null;
  repoId: string;
}

const SCAN_STEPS = [
  { icon: Download,    label: 'Downloading repository',  ms: 0    },
  { icon: Cpu,         label: 'Running Knip analysis',   ms: 8000 },
  { icon: Database,    label: 'Saving results',           ms: 45000 },
] as const;

const statusConfig = {
  completed: { label: 'Ready',   className: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20' },
  running:   { label: 'Running', className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
  pending:   { label: 'Queued',  className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
  failed:    { label: 'Failed',  className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20' },
  dead:      { label: 'Failed',  className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20' },
} as const;

export function RepoHeader({ repo, latestJob, repoId }: RepoHeaderProps) {
  const [scanning, setScanning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const router = useRouter();

  const status = latestJob?.status as keyof typeof statusConfig | undefined;
  const statusCfg = status ? statusConfig[status] : null;
  const isProcessing = status === 'running' || status === 'pending';

  // Advance step indicators while scan is in-flight
  useEffect(() => {
    if (!scanning) { setStepIdx(0); setElapsed(0); return; }
    startRef.current = Date.now();

    const tick = setInterval(() => {
      const ms = Date.now() - startRef.current;
      setElapsed(ms);
      const next = [...SCAN_STEPS].reverse().findIndex(s => ms >= s.ms);
      if (next !== -1) setStepIdx(SCAN_STEPS.length - 1 - next);
    }, 300);

    return () => clearInterval(tick);
  }, [scanning]);

  // Keep sidebar status live while scan is in-flight
  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [scanning, router]);

  async function triggerScan() {
    setScanning(true);
    setStepIdx(0);
    try {
      const res = await fetch(`/api/repos/${repoId}/scan`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Scan failed');
      } else {
        toast.success('Scan complete — results updated!');
      }
      router.refresh();
    } catch {
      toast.error('Network error');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-3">
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
            {statusCfg && !scanning && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
                {statusCfg.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              {repo.scan_branch ?? repo.default_branch}
            </span>
            {latestJob && !scanning && (
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

      {scanning && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Scanning in progress…</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {(elapsed / 1000).toFixed(0)}s
            </span>
          </div>
          <div className="space-y-2">
            {SCAN_STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i < stepIdx;
              const active = i === stepIdx;
              return (
                <div key={i} className={`flex items-center gap-2.5 text-sm transition-opacity ${i > stepIdx ? 'opacity-30' : 'opacity-100'}`}>
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    : active
                      ? <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      : <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className={done ? 'text-muted-foreground line-through' : active ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(95, (elapsed / 55000) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
