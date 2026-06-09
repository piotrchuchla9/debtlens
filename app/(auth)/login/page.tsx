'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function signInWithGitHub() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/github/callback`,
        scopes: 'read:user read:org',
      },
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Top bar */}
      <div className="absolute left-6 right-6 top-5 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      {/* Gradient bg */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/5 blur-3xl dark:bg-primary/8" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Welcome to DebtLens</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to track your dead code trends</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-lg shadow-black/5 dark:shadow-black/20">
          <Button
            className="w-full gap-2.5 h-11 text-sm font-medium"
            onClick={signInWithGitHub}
            disabled={loading}
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            {loading ? 'Redirecting to GitHub…' : 'Continue with GitHub'}
          </Button>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/docs" className="underline underline-offset-4 hover:text-foreground transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/docs" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Free for 1 repository · No credit card required
        </p>
      </div>
    </div>
  );
}
