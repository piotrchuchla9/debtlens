import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, GitBranch, Bell, TrendingDown, Check,
  ArrowRight, Zap, Shield, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>DebtLens</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center">
        {/* Gradient orb */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-xs">
            <Zap className="h-3 w-3" />
            Powered by Knip v5 · Zero config
          </Badge>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
            Is your codebase getting{' '}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-400">
                cleaner or dirtier?
              </span>
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground leading-relaxed">
            DebtLens runs Knip on every push and shows you a historical trend of dead code per repository.
            Install the GitHub App and you&apos;re done — no CI yaml to write.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-8 text-base shadow-lg">
              <Link href="/login">
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Install GitHub App
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-8 text-base">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-xs text-muted-foreground">
            Free for 1 repository · No credit card required
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/50 px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">debtlens.live/repo/my-org/frontend</span>
            </div>
            {/* App shell: sidebar + main */}
            <div className="flex h-[272px] text-left">
              {/* Sidebar */}
              <div className="w-44 shrink-0 border-r border-border/40 bg-muted/20 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 px-2 py-1 mb-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
                    <BarChart3 className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold">DebtLens</span>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-0.5">Repositories</div>
                {[
                  { name: 'frontend', active: true, dot: 'bg-yellow-500' },
                  { name: 'api', active: false, dot: 'bg-green-500' },
                  { name: 'mobile', active: false, dot: 'bg-muted-foreground/30' },
                ].map(({ name, active, dot }) => (
                  <div key={name} className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${active ? 'bg-accent font-medium' : 'text-muted-foreground'}`}>
                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                    {name}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="flex-1 overflow-hidden bg-background p-4 space-y-3">
                <div className="text-sm font-semibold">my-org / frontend</div>
                {/* Health score card */}
                <div className="rounded-lg border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">Total dead code</span>
                    <div className="flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-500">
                      <TrendingDown className="h-2.5 w-2.5" />
                      -5
                    </div>
                  </div>
                  <div className="text-4xl font-bold tabular-nums text-yellow-500 mb-2">34</div>
                  <div className="grid grid-cols-3 divide-x divide-border/60 text-center">
                    {[['8', 'Files'], ['21', 'Exports'], ['5', 'Deps']].map(([v, l]) => (
                      <div key={l} className="flex flex-col items-center px-2">
                        <span className="text-sm font-semibold tabular-nums">{v}</span>
                        <span className="text-[10px] text-muted-foreground">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Trend chart */}
                <div className="rounded-lg border border-border/60 bg-card p-3">
                  <div className="text-[11px] font-semibold mb-1.5">Dead Code Trend</div>
                  <svg viewBox="0 0 300 48" className="w-full h-12" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lp-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,4 L33,12 L67,6 L100,15 L133,20 L167,24 L200,30 L233,36 L267,40 L300,44 L300,48 L0,48 Z" fill="url(#lp-grad)" />
                    <polyline points="0,4 33,12 67,6 100,15 133,20 167,24 200,30 233,36 267,40 300,44" fill="none" stroke="rgb(99,102,241)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/40 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to track technical debt</h2>
            <p className="mt-3 text-muted-foreground">Built for engineering teams that take code quality seriously.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: TrendingDown,
                title: 'Historical Trends',
                desc: 'Line charts per commit — unused files, exports, and dependencies tracked over time so you can see if debt is growing or shrinking.',
                color: 'text-blue-500 bg-blue-500/10',
              },
              {
                icon: Zap,
                title: 'Zero Config',
                desc: 'Install the GitHub App and DebtLens automatically scans every push to your default branch. No CI YAML to write.',
                color: 'text-yellow-500 bg-yellow-500/10',
              },
              {
                icon: Bell,
                title: 'Slack Alerts',
                desc: 'Get a Slack notification when dead code spikes by more than your configured threshold in a single push.',
                color: 'text-red-500 bg-red-500/10',
              },
              {
                icon: GitBranch,
                title: 'Multi-language',
                desc: 'Supports JavaScript, TypeScript, Python, and Go out of the box. Powered by Knip v5 for JS/TS and native parsers for other languages.',
                color: 'text-violet-500 bg-violet-500/10',
              },
              {
                icon: Shield,
                title: 'Secure by Default',
                desc: 'Row Level Security on all data. GitHub App with minimal permissions. HMAC-verified webhooks.',
                color: 'text-green-500 bg-green-500/10',
              },
              {
                icon: Users,
                title: 'Team Access',
                desc: 'Install on a GitHub Organization and every team member automatically sees shared repositories — no manual invite needed.',
                color: 'text-orange-500 bg-orange-500/10',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group rounded-xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md dark:hover:shadow-black/30">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/40 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
            {/* Free */}
            <div className="flex flex-col rounded-xl border border-border/60 bg-card p-8">
              <div className="mb-1 text-sm font-medium text-muted-foreground">Free</div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-8 space-y-3 text-sm flex-1">
                {['1 repository', '90-day history', 'README badge', 'Manual scans', 'JS / TS / Python / Go'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full mt-auto" size="lg">
                <Link href="/login">Get started free</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-xl border-2 border-primary bg-card p-8 shadow-lg shadow-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-3 text-xs shadow-sm">Most popular</Badge>
              </div>
              <div className="mb-1 text-sm font-medium text-muted-foreground">Pro</div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">$35</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-8 space-y-3 text-sm flex-1">
                {[
                  'Unlimited repositories',
                  'Full history',
                  'Slack spike alerts',
                  'Knip config override',
                  'Team & org access',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full mt-auto" size="lg">
                <Link href="/login">Start with Pro</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
              <BarChart3 className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">DebtLens</span>
          </div>
          <p>© {new Date().getFullYear()} DebtLens · Built for teams who care about code quality</p>
        </div>
      </footer>
    </div>
  );
}
