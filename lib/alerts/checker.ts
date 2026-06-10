import { createServiceClient } from '@/lib/supabase/server';

export async function checkAndSendAlert(
  repoId: string,
  currentTotal: number,
  previousTotal: number | null
): Promise<void> {
  if (previousTotal === null || previousTotal === 0) return;

  const changePct = ((currentTotal - previousTotal) / previousTotal) * 100;
  if (changePct <= 0) return;

  const supabase = await createServiceClient();

  const { data: config } = await supabase
    .from('alert_configs')
    .select('*')
    .eq('repo_id', repoId)
    .single();

  if (!config?.slack_webhook_url || changePct < config.threshold_pct) return;

  const { data: repo } = await supabase
    .from('repositories')
    .select('full_name')
    .eq('id', repoId)
    .single();

  if (!repo) return;

  const diff = currentTotal - previousTotal;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/repo/${repoId}`;

  await fetch(config.slack_webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `⚠️ Dead code spike in *${repo.full_name}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ *Dead code spike detected in \`${repo.full_name}\`*\nIncreased by *+${changePct.toFixed(1)}%* (+${diff} items)\n${previousTotal} → ${currentTotal} total dead code items`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard' },
              url: dashboardUrl,
            },
          ],
        },
      ],
    }),
  });
}
