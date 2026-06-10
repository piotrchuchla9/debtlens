import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TrendPoint } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const days = parseInt(searchParams.get('days') ?? '90', 10);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const isPro = profile?.plan === 'pro';
  const maxDays = isPro ? days : Math.min(days, 90);
  const since = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();

  // RLS enforces access (own repos + org member repos)
  const { data: repo } = await supabase
    .from('repositories')
    .select('id')
    .eq('id', id)
    .single();

  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: results, error } = await supabase
    .from('analysis_results')
    .select('commit_sha, created_at, total_dead_code, unused_files_count, unused_exports_count, unused_deps_count, job_run_id')
    .eq('repo_id', id)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const trend: TrendPoint[] = (results ?? []).map((r, i, arr) => ({
    date: r.created_at,
    sha: r.commit_sha.slice(0, 7),
    total: r.total_dead_code,
    files: r.unused_files_count,
    exports: r.unused_exports_count,
    deps: r.unused_deps_count,
    delta: i === 0 ? null : r.total_dead_code - arr[i - 1].total_dead_code,
  }));

  return NextResponse.json({ trend }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
  });
}
