import { createClient } from '@/lib/supabase/server';
import { RepoCard } from '@/components/dashboard/RepoCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { RepositoryWithLatestAnalysis } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: repos } = await supabase
    .from('repositories')
    .select(`
      *,
      analysis_results(id, total_dead_code, unused_files_count, unused_exports_count, unused_deps_count, created_at),
      job_runs(id, status, triggered_at, commit_sha, commit_message)
    `)
    .eq('owner_user_id', user!.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const enriched: RepositoryWithLatestAnalysis[] = (repos ?? []).map(repo => ({
    ...repo,
    latest_analysis: (repo.analysis_results as typeof repo.analysis_results)
      ?.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null,
    latest_job: (repo.job_runs as typeof repo.job_runs)
      ?.sort((a: { triggered_at: string }, b: { triggered_at: string }) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())[0] ?? null,
  }));

  const installUrl = `https://github.com/apps/debtlens/installations/new`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {enriched.length} {enriched.length === 1 ? 'repository' : 'repositories'} connected
          </p>
        </div>
        <Button asChild>
          <a href={installUrl} target="_blank" rel="noopener noreferrer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add repository
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
          <h2 className="text-lg font-semibold mb-2">No repositories yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Install the DebtLens GitHub App to start tracking dead code in your repositories.
          </p>
          <Button asChild>
            <a href={installUrl} target="_blank" rel="noopener noreferrer">
              <PlusCircle className="mr-2 h-4 w-4" />
              Install GitHub App
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enriched.map(repo => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
