import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { downloadAndExtractRepo, cleanupWorkDir, checkRepoSize } from '@/lib/github/download';
import { getInstallationOctokit } from '@/lib/github/app';
import { runAnalysis } from '@/lib/analysis/runner';
import { parseKnipOutput } from '@/lib/analysis/parser';
import { checkAndSendAlert } from '@/lib/alerts/checker';
import { PLANS } from '@/lib/stripe/plans';
import { postCommitStatus, postPRComment, postPendingStatus } from '@/lib/github/pr';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const isInternalCall = req.headers.get('x-internal-secret') === process.env.INTERNAL_JOB_SECRET;

  let userId: string;

  if (isInternalCall && body.job_run_id) {
    return runJobInternal(body.job_run_id, id);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  userId = user.id;

  const { data: repo } = await supabase
    .from('repositories')
    .select('id, owner_user_id')
    .eq('id', id)
    .eq('owner_user_id', userId)
    .single();

  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = (profile?.plan ?? 'free') as keyof typeof PLANS;
  const cooldownMs = PLANS[plan].manualScanCooldownMs;

  const { data: lastJob } = await supabase
    .from('job_runs')
    .select('triggered_at')
    .eq('repo_id', id)
    .in('status', ['pending', 'running', 'completed'])
    .order('triggered_at', { ascending: false })
    .limit(1)
    .single();

  if (lastJob) {
    const elapsed = Date.now() - new Date(lastJob.triggered_at).getTime();
    if (elapsed < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
      return NextResponse.json({ error: `Rate limited. Try again in ${waitSec}s` }, { status: 429 });
    }
  }

  const { data: repoDB } = await supabase
    .from('repositories')
    .select('default_branch, full_name')
    .eq('id', id)
    .single();

  if (!repoDB) return NextResponse.json({ error: 'Repo not found' }, { status: 404 });

  const { data: job } = await supabase
    .from('job_runs')
    .insert({
      repo_id: id,
      commit_sha: 'manual',
      commit_message: 'Manual scan',
      branch: repoDB.default_branch,
      status: 'pending',
    })
    .select()
    .single();

  if (!job) return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });

  // Run analysis synchronously in this request (60s timeout via vercel.json)
  const result = await runJobInternal(job.id, id);

  return result;
}

async function runJobInternal(jobRunId: string, repoId: string): Promise<NextResponse> {
  const supabase = await createServiceClient();

  const { data: job } = await supabase
    .from('job_runs')
    .select('*, repositories(*)')
    .eq('id', jobRunId)
    .single();

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const repo = job.repositories as { full_name: string; knip_config_override: Record<string, unknown> | null; owner_user_id: string; scan_branch: string | null; default_branch: string };
  const [owner, repoName] = repo.full_name.split('/');
  const startedAt = new Date().toISOString();

  await supabase
    .from('job_runs')
    .update({ status: 'running', started_at: startedAt })
    .eq('id', jobRunId);

  let workDir: string | null = null;

  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('installation_id')
      .eq('owner_user_id', repo.owner_user_id)
      .single();

    let installationId = org?.installation_id;
    if (!installationId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('installation_id')
        .eq('id', repo.owner_user_id)
        .single();
      installationId = profile?.installation_id ?? parseInt(process.env.GITHUB_APP_INSTALLATION_ID ?? '0', 10);
    }
    const octokit = await getInstallationOctokit(installationId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.debtlens.live';
    const dashboardUrl = `${appUrl}/repo/${repoId}`;

    // Post pending status immediately so PR shows "checks in progress"
    if (job.pr_number && job.commit_sha !== 'manual') {
      await postPendingStatus(octokit, owner, repoName, job.commit_sha, dashboardUrl).catch(() => {});
    }

    await checkRepoSize(octokit, owner, repoName);
    const ref = job.commit_sha === 'manual'
      ? (repo.scan_branch ?? repo.default_branch ?? 'HEAD')
      : job.commit_sha;
    workDir = await downloadAndExtractRepo(octokit, owner, repoName, ref, jobRunId);

    const { output, version } = await runAnalysis(workDir, repo.knip_config_override);
    const parsed = parseKnipOutput(output);

    const { data: prevResult } = await supabase
      .from('analysis_results')
      .select('total_dead_code')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { total_dead_code, ...insertParsed } = parsed;
    await supabase.from('analysis_results').insert({
      job_run_id: jobRunId,
      repo_id: repoId,
      commit_sha: job.commit_sha,
      ...insertParsed,
      knip_version: version,
    });

    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    await supabase
      .from('job_runs')
      .update({ status: 'completed', completed_at: completedAt, duration_ms: durationMs })
      .eq('id', jobRunId);

    if (job.pr_number && job.commit_sha !== 'manual') {
      // Get base branch analysis for comparison
      const { data: baseJob } = await supabase
        .from('job_runs')
        .select('id')
        .eq('repo_id', repoId)
        .eq('status', 'completed')
        .is('pr_number', null)
        .order('triggered_at', { ascending: false })
        .limit(1)
        .single();

      let baseAnalysis: { total: number; files: number; exports: number; deps: number } | null = null;
      if (baseJob) {
        const { data: baseResult } = await supabase
          .from('analysis_results')
          .select('total_dead_code, unused_files_count, unused_exports_count, unused_deps_count')
          .eq('job_run_id', baseJob.id)
          .single();
        if (baseResult) {
          baseAnalysis = {
            total: baseResult.total_dead_code,
            files: baseResult.unused_files_count,
            exports: baseResult.unused_exports_count,
            deps: baseResult.unused_deps_count,
          };
        }
      }

      const current = {
        total: total_dead_code,
        files: parsed.unused_files_count,
        exports: parsed.unused_exports_count,
        deps: parsed.unused_deps_count,
      };

      await Promise.allSettled([
        postCommitStatus(octokit, owner, repoName, job.commit_sha, current, baseAnalysis, dashboardUrl),
        postPRComment(octokit, owner, repoName, job.pr_number, current, baseAnalysis, dashboardUrl),
      ]);
    } else {
      await checkAndSendAlert(repoId, total_dead_code, prevResult?.total_dead_code ?? null);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await supabase
      .from('job_runs')
      .update({
        status: 'failed',
        error_message: message,
        retry_count: (job.retry_count ?? 0) + 1,
      })
      .eq('id', jobRunId);

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (workDir) await cleanupWorkDir(jobRunId);
  }
}
