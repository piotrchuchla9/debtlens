import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncOrgMemberships } from '@/lib/github/orgs';

export async function POST() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user || !session.provider_token) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await syncOrgMemberships(supabase, session.user.id, session.provider_token);

  return NextResponse.json({ ok: true });
}
