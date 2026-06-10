'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteRepoButton({ repoId, repoName }: { repoId: string; repoName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/repos/${repoId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete repository
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Remove <strong>{repoName}</strong> and all scan data?</span>
      <Button variant="destructive" size="sm" disabled={loading} onClick={handleDelete}>
        {loading ? 'Deleting…' : 'Yes, delete'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
