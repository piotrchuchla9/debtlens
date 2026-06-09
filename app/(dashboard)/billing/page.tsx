import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BillingPanel } from '@/components/dashboard/BillingPanel';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const { data: repos } = await supabase
    .from('repositories')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('is_active', true);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your plan and subscription</p>
      </div>
      <BillingPanel
        plan={profile?.plan ?? 'free'}
        hasStripeCustomer={!!profile?.stripe_customer_id}
        repoCount={repos?.length ?? 0}
      />
    </div>
  );
}
