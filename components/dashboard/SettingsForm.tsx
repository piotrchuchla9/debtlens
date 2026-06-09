'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BranchCombobox } from '@/components/dashboard/BranchCombobox';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AlertConfig, Repository } from '@/types';

interface SettingsFormProps {
  repo: Repository;
  alertConfig: AlertConfig | null;
  isPro: boolean;
}

export function SettingsForm({ repo, alertConfig, isPro }: SettingsFormProps) {
  const [scanBranch, setScanBranch] = useState(repo.scan_branch ?? '');
  const [threshold, setThreshold] = useState(String(alertConfig?.threshold_pct ?? 5));
  const [slackUrl, setSlackUrl] = useState(alertConfig?.slack_webhook_url ?? '');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function save() {
    setSaving(true);
    try {
      await supabase
        .from('repositories')
        .update({ scan_branch: scanBranch.trim() || null })
        .eq('id', repo.id);

      const alertPayload = {
        repo_id: repo.id,
        threshold_pct: parseInt(threshold, 10),
        email_enabled: true,
        slack_webhook_url: isPro && slackUrl ? slackUrl : null,
      };
      if (alertConfig) {
        await supabase.from('alert_configs').update(alertPayload).eq('repo_id', repo.id);
      } else {
        await supabase.from('alert_configs').insert(alertPayload);
      }
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scan Settings</CardTitle>
          <CardDescription>Configure which branch DebtLens scans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Branch to scan</Label>
            <BranchCombobox
              repoId={repo.id}
              value={scanBranch}
              defaultBranch={repo.default_branch}
              onChange={setScanBranch}
            />
            <p className="text-xs text-muted-foreground">
              Leave as default or pick another branch to scan.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Settings</CardTitle>
          <CardDescription>Configure when to receive dead code spike notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="threshold">Alert threshold (%)</Label>
            <Input
              id="threshold"
              type="number"
              min="1"
              max="100"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Send an alert when dead code increases by more than this percentage in a single push.
            </p>
          </div>

          {isPro ? (
            <div className="space-y-2">
              <Label htmlFor="slack">Slack webhook URL</Label>
              <Input
                id="slack"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackUrl}
                onChange={e => setSlackUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Slack alerts are available on the Pro plan.{' '}
              <a href="/billing" className="underline">Upgrade</a>
            </div>
          )}

          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
