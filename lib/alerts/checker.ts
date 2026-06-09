import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function checkAndSendAlert(
  repoId: string,
  currentTotal: number,
  previousTotal: number | null
): Promise<void> {
  if (previousTotal === null || previousTotal === 0) return;

  const supabase = await createServiceClient();

  const { data: config } = await supabase
    .from('alert_configs')
    .select('*')
    .eq('repo_id', repoId)
    .single();

  if (!config?.email_enabled) return;

  const changePct = ((currentTotal - previousTotal) / previousTotal) * 100;
  if (changePct <= config.threshold_pct) return;

  const { data: repo } = await supabase
    .from('repositories')
    .select('full_name, owner_user_id')
    .eq('id', repoId)
    .single();

  if (!repo) return;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('github_username')
    .eq('id', repo.owner_user_id)
    .single();

  const { data: authUser } = await supabase.auth.admin.getUserById(repo.owner_user_id);
  const email = authUser?.user?.email;
  if (!email) return;

  await getResend().emails.send({
    from: 'DebtLens <alerts@debtlens.dev>',
    to: email,
    subject: `⚠️ Dead code spike in ${repo.full_name} (+${changePct.toFixed(1)}%)`,
    html: `
      <h2>Dead code alert for ${repo.full_name}</h2>
      <p>Your repository's dead code count increased by <strong>${changePct.toFixed(1)}%</strong>.</p>
      <ul>
        <li>Previous total: ${previousTotal}</li>
        <li>Current total: ${currentTotal}</li>
        <li>Change: +${currentTotal - previousTotal} items</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/repo/${repoId}">View dashboard →</a></p>
    `,
  });
}
