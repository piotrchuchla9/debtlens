'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface BadgeEmbedProps {
  repoId: string;
  appUrl: string;
}

export function BadgeEmbed({ repoId, appUrl }: BadgeEmbedProps) {
  const [copied, setCopied] = useState(false);
  const badgeUrl = `${appUrl}/api/badge/${repoId}`;
  const repoUrl = `${appUrl}/repo/${repoId}`;
  const markdown = `[![DebtLens](${badgeUrl})](${repoUrl})`;

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
        <code className="flex-1 text-xs break-all">{markdown}</code>
        <Button size="sm" variant="ghost" onClick={copyMarkdown} className="shrink-0">
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
