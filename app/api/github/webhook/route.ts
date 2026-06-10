import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { verifyWebhookSignature } from '@/lib/github/webhook';
import { createServiceClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/stripe/plans';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-hub-signature-256') ?? '';
  const event = req.headers.get('x-github-event') ?? '';

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const supabase = await createServiceClient();

  try {
    if (event === 'push') {
      await handlePush(supabase, payload);
    } else if (event === 'installation' || event === 'installation_repositories') {
      await handleInstallation(supabase, payload);
    } else if (event === 'pull_request') {
      await handlePullRequest(supabase, payload);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return NextResponse.json({ ok: true });
}

async function handlePush(supabase: Awaited<ReturnType<typeof createServiceClient>>, payload: Record<string, unknown>) {
  const repoData = payload.repository as Record<string, unknown>;
  const headCommit = payload.head_commit as Record<string, unknown>;
  if (!headCommit) return;

  const ref = payload.ref as string;
  const branch = ref.replace('refs/heads/', '');

  const { data: repo } = await supabase
    .from('repositories')
    .select('id, default_branch')
    .eq('github_repo_id', (repoData.id as number))
    .single();

  if (!repo || repo.default_branch !== branch) return;

  const { data: job } = await supabase.from('job_runs').insert({
    repo_id: repo.id,
    commit_sha: headCommit.id as string,
    commit_message: ((headCommit.message as string) ?? '').slice(0, 120),
    branch,
    status: 'pending',
  }).select().single();

  if (job) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    waitUntil(fetch(`${appUrl}/api/repos/${repo.id}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_JOB_SECRET ?? '',
      },
      body: JSON.stringify({ job_run_id: job.id }),
    }).catch(() => {}));
  }
}

async function handleInstallation(supabase: Awaited<ReturnType<typeof createServiceClient>>, payload: Record<string, unknown>) {
  const action = payload.action as string;
  const installation = payload.installation as Record<string, unknown>;
  const sender = payload.sender as Record<string, unknown>;

  if (action === 'deleted') {
    await supabase
      .from('organizations')
      .update({})
      .eq('installation_id', installation.id as number);
    await supabase
      .from('repositories')
      .update({ is_active: false })
      .in('org_id',
        (await supabase
          .from('organizations')
          .select('id')
          .eq('installation_id', installation.id as number)
        ).data?.map(o => o.id) ?? []
      );
    return;
  }

  const repos = (payload.repositories ?? (payload as Record<string, unknown>).repositories_added ?? []) as Array<Record<string, unknown>>;
  const account = installation.account as Record<string, unknown>;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('github_id', (sender.id as number))
    .single();

  if (!profile) return;

  if (account.type === 'Organization') {
    await supabase.from('organizations').upsert({
      github_org_id: account.id as number,
      name: account.login as string,
      installation_id: installation.id as number,
      owner_user_id: profile.id,
    }, { onConflict: 'github_org_id' });
  } else {
    await supabase
      .from('user_profiles')
      .update({ installation_id: installation.id as number })
      .eq('id', profile.id);
  }

  const { data: profilePlan } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', profile.id)
    .single();

  const plan = (profilePlan?.plan ?? 'free') as keyof typeof PLANS;
  const maxRepos = PLANS[plan].maxRepos;

  const { count: existingCount } = await supabase
    .from('repositories')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', profile.id)
    .eq('is_active', true);

  let added = existingCount ?? 0;

  for (const r of repos) {
    if (added >= maxRepos) break;

    const { data: existing } = await supabase
      .from('repositories')
      .select('id, is_active')
      .eq('github_repo_id', r.id as number)
      .single();

    // Don't count repos that are already tracked toward the limit
    if (existing?.is_active) {
      await supabase.from('repositories').update({
        full_name: r.full_name as string,
        is_active: true,
      }).eq('id', existing.id);
      continue;
    }

    await supabase.from('repositories').upsert({
      github_repo_id: r.id as number,
      owner_user_id: profile.id,
      full_name: r.full_name as string,
      default_branch: 'main',
      is_active: true,
    }, { onConflict: 'github_repo_id' });

    added++;
  }
}

async function handlePullRequest(supabase: Awaited<ReturnType<typeof createServiceClient>>, payload: Record<string, unknown>) {
  const action = payload.action as string;
  if (action !== 'opened' && action !== 'synchronize') return;

  const pr = payload.pull_request as Record<string, unknown>;
  const repoData = payload.repository as Record<string, unknown>;
  const head = pr.head as Record<string, unknown>;

  const { data: repo } = await supabase
    .from('repositories')
    .select('id')
    .eq('github_repo_id', (repoData.id as number))
    .single();

  if (!repo) return;

  const { data: job } = await supabase.from('job_runs').insert({
    repo_id: repo.id,
    commit_sha: head.sha as string,
    commit_message: `PR #${pr.number as number}: ${pr.title as string}`.slice(0, 120),
    branch: (head.ref as string),
    pr_number: pr.number as number,
    status: 'pending',
  }).select().single();

  if (job) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    waitUntil(fetch(`${appUrl}/api/repos/${repo.id}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_JOB_SECRET ?? '',
      },
      body: JSON.stringify({ job_run_id: job.id }),
    }).catch(() => {}));
  }
}
