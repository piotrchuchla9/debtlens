import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: repos, error } = await supabase
    .from('repositories')
    .select(`
      *,
      analysis_results(
        id, total_dead_code, unused_files_count, unused_exports_count, unused_deps_count, created_at
      ),
      job_runs(
        id, status, triggered_at, commit_sha, commit_message
      )
    `)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = repos?.map(repo => ({
    ...repo,
    latest_analysis: repo.analysis_results
      ?.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null,
    latest_job: repo.job_runs
      ?.sort((a: { triggered_at: string }, b: { triggered_at: string }) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())[0] ?? null,
  }));

  return NextResponse.json({ repos: enriched ?? [] });
}
