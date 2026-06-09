import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BreakdownTabs } from '@/components/dashboard/BreakdownTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GitCommit, Calendar, Code2 } from 'lucide-react';
import { FileBreakdown, ExportBreakdown } from '@/types';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string; sha: string }>;
}

export default async function CommitPage({ params }: PageProps) {
  const { id, sha } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: repo } = await supabase
    .from('repositories')
    .select('id, full_name')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!repo) notFound();

  const { data: result } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('repo_id', id)
    .eq('commit_sha', sha)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!result) notFound();

  const files = ((result.unused_files_list ?? []) as FileBreakdown[])
    .sort((a, b) => (b.unusedExports ?? 0) - (a.unusedExports ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href={`/repo/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{repo.full_name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GitCommit className="h-3.5 w-3.5" />
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{sha}</code>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(result.created_at)}
          </span>
          {result.knip_version && (
            <span className="flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5" />
              knip {result.knip_version}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{result.total_dead_code}</div>
              <div className="mt-1 text-xs text-muted-foreground">Total dead code</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{result.unused_files_count}</div>
              <div className="mt-1 text-xs text-muted-foreground">Unused files</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{result.unused_exports_count}</div>
              <div className="mt-1 text-xs text-muted-foreground">Unused exports</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <BreakdownTabs
            files={files}
            exports={(result.unused_exports_list ?? []) as ExportBreakdown[]}
            deps={(result.unused_deps_list ?? []) as string[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
