import { createServiceClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export async function syncOrgMemberships(
  userClient: SupabaseClient,
  userId: string,
  providerToken: string,
): Promise<void> {
  const resp = await fetch(
    'https://api.github.com/user/memberships/orgs?state=active&per_page=100',
    {
      headers: {
        Authorization: `Bearer ${providerToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!resp.ok) return;

  const memberships: Array<{ organization: { id: number } }> = await resp.json();
  const githubOrgIds = memberships.map(m => m.organization.id);
  if (!githubOrgIds.length) return;

  // Service client needed — user's RLS only sees orgs they own
  const service = createServiceClient();
  const { data: orgs } = await service
    .from('organizations')
    .select('id')
    .in('github_org_id', githubOrgIds);

  if (!orgs?.length) return;

  await userClient.from('org_members').upsert(
    orgs.map(org => ({ org_id: org.id, user_id: userId })),
    { onConflict: 'org_id,user_id', ignoreDuplicates: true },
  );
}
