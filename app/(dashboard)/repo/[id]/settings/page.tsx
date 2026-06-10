import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RepoSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: repo } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!repo) notFound();

  const { data: alertConfig } = await supabase
    .from('alert_configs')
    .select('*')
    .eq('repo_id', id)
    .single();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-1" asChild>
          <Link href={`/repo/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">{repo.full_name}</p>
      </div>
      <SettingsForm
        repo={repo}
        alertConfig={alertConfig}
        isPro={profile?.plan === 'pro'}
      />
    </div>
  );
}
