export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('github_username, plan')
    .eq('id', user.id)
    .single();

  const { data: repos } = await supabase
    .from('repositories')
    .select('id, full_name')
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar repos={repos ?? []} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          username={profile?.github_username}
          plan={profile?.plan as 'free' | 'pro' | undefined}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster richColors />
    </div>
  );
}
