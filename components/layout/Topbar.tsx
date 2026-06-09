'use client';

import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  username?: string;
  plan?: 'free' | 'pro';
}

export function Topbar({ username, plan }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div />
      <div className="flex items-center gap-3">
        {plan && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${plan === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        )}
        {username && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {username}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
