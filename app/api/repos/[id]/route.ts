import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: repo } = await supabase
    .from('repositories')
    .select('id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const service = await createServiceClient();
  await service.from('alert_configs').delete().eq('repo_id', id);
  await service.from('analysis_results').delete().eq('repo_id', id);
  await service.from('job_runs').delete().eq('repo_id', id);
  await service.from('repositories').delete().eq('id', id);

  return NextResponse.json({ ok: true });
}
