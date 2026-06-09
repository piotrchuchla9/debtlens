import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getInstallationOctokit } from '@/lib/github/app';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: repo } = await supabase
    .from('repositories')
    .select('full_name, owner_user_id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const service = createServiceClient();
  const { data: org } = await service
    .from('organizations')
    .select('installation_id')
    .eq('owner_user_id', repo.owner_user_id)
    .single();

  let installationId = org?.installation_id;
  if (!installationId) {
    const { data: profile } = await service
      .from('user_profiles')
      .select('installation_id')
      .eq('id', repo.owner_user_id)
      .single();
    installationId = profile?.installation_id ?? parseInt(process.env.GITHUB_APP_INSTALLATION_ID ?? '0', 10);
  }

  const octokit = await getInstallationOctokit(installationId);
  const [owner, repoName] = repo.full_name.split('/');

  const branches: string[] = [];
  for await (const response of octokit.paginate.iterator(octokit.repos.listBranches, { owner, repo: repoName, per_page: 100 })) {
    for (const branch of response.data) {
      branches.push(branch.name);
    }
    if (branches.length >= 200) break;
  }

  return NextResponse.json({ branches });
}
