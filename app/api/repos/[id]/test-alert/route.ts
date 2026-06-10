import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = await createServiceClient();

  const { data: config } = await service
    .from('alert_configs')
    .select('slack_webhook_url')
    .eq('repo_id', id)
    .single();

  if (!config?.slack_webhook_url) {
    return NextResponse.json({ error: 'No Slack webhook configured' }, { status: 400 });
  }

  const { data: repo } = await service
    .from('repositories')
    .select('full_name, owner_user_id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/repo/${id}`;

  const res = await fetch(config.slack_webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🧪 Test alert from DebtLens for *${repo.full_name}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🧪 *Test alert — DebtLens is connected to \`${repo.full_name}\`*\nIf you see this message, Slack alerts are working correctly.`,
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

  if (!res.ok) {
    return NextResponse.json({ error: 'Slack returned an error' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
