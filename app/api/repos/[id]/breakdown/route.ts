import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FileBreakdown, ExportBreakdown, FileEntry, ExportEntry } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const sha = searchParams.get('sha');

  const { data: repo } = await supabase
    .from('repositories')
    .select('id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let query = supabase
    .from('analysis_results')
    .select('unused_files_list, unused_exports_list, unused_deps_list')
    .eq('repo_id', id);

  if (sha) {
    query = query.eq('commit_sha', sha);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data: results, error } = await query;
  if (error || !results?.length) {
    return NextResponse.json({ files: [], exports: [], deps: [] });
  }

  const result = results[0];
  const files = (result.unused_files_list as FileEntry[])
    .sort((a, b) => (b.exportCount ?? 0) - (a.exportCount ?? 0))
    .slice(0, 10);

  return NextResponse.json({
    files,
    exports: result.unused_exports_list as ExportBreakdown[],
    deps: result.unused_deps_list as string[],
  });
}
