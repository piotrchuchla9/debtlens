'use client';

import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card px-6">
      <div />
      <div className="flex items-center gap-2">
        {plan === 'pro' && (
          <Badge variant="default" className="h-5 px-2 text-[10px] font-semibold uppercase tracking-wide">
            Pro
          </Badge>
        )}
        {username && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{username}</span>
          </div>
        )}
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={signOut}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
