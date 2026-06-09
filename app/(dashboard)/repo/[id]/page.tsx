import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { CommitTable } from '@/components/dashboard/CommitTable';
import { BreakdownTabs } from '@/components/dashboard/BreakdownTabs';
import { BadgeEmbed } from '@/components/dashboard/BadgeEmbed';
import { TrendChartWrapper } from '@/components/charts/TrendChartWrapper';
import { RepoHeader } from '@/components/dashboard/RepoHeader';
import { ScanPoller } from '@/components/dashboard/ScanPoller';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendPoint, FileBreakdown, ExportBreakdown } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RepoPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: repo } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!repo) notFound();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const isPro = profile?.plan === 'pro';
  const maxDays = isPro ? 365 : 90;
  const since = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: results } = await supabase
    .from('analysis_results')
    .select('commit_sha, created_at, total_dead_code, unused_files_count, unused_exports_count, unused_deps_count')
    .eq('repo_id', id)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  const trend: TrendPoint[] = (results ?? []).map((r, i, arr) => ({
    date: r.created_at,
    sha: r.commit_sha.slice(0, 7),
    total: r.total_dead_code,
    files: r.unused_files_count,
    exports: r.unused_exports_count,
    deps: r.unused_deps_count,
    delta: i === 0 ? null : r.total_dead_code - arr[i - 1].total_dead_code,
  }));

  const latest = trend[trend.length - 1];

  const { data: breakdown } = await supabase
    .from('analysis_results')
    .select('unused_files_list, unused_exports_list, unused_deps_list')
    .eq('repo_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const files = ((breakdown?.unused_files_list ?? []) as FileBreakdown[])
    .sort((a, b) => (b.unusedExports ?? 0) - (a.unusedExports ?? 0))
    .slice(0, 10);

  const { data: latestJob } = await supabase
    .from('job_runs')
    .select('id, status, triggered_at, commit_sha')
    .eq('repo_id', id)
    .order('triggered_at', { ascending: false })
    .limit(1)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const isJobActive = latestJob?.status === 'pending' || latestJob?.status === 'running';

  return (
    <div className="space-y-6">
      <ScanPoller isActive={isJobActive} />
      <RepoHeader
        repo={repo}
        latestJob={latestJob}
        repoId={id}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <HealthScoreCard
          total={latest?.total ?? 0}
          delta={latest?.delta ?? null}
          files={latest?.files ?? 0}
          exports={latest?.exports ?? 0}
          deps={latest?.deps ?? 0}
        />
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">README Badge</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgeEmbed repoId={id} appUrl={appUrl} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dead Code Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChartWrapper data={trend} isPro={isPro} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Commits</CardTitle>
          </CardHeader>
          <CardContent>
            <CommitTable trend={trend} repoId={id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownTabs
              files={files}
              exports={(breakdown?.unused_exports_list ?? []) as ExportBreakdown[]}
              deps={(breakdown?.unused_deps_list ?? []) as string[]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
