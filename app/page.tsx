import Link from 'next/link';
import { BarChart3, GitBranch, Bell, TrendingDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <span className="text-xl font-bold">DebtLens</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">Docs</Link>
          <Button asChild variant="outline" size="sm"><Link href="/login">Sign in</Link></Button>
          <Button asChild size="sm"><Link href="/login">Get started free</Link></Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
          <TrendingDown className="h-3.5 w-3.5" />
          Track dead code trends in your JS/TS repos
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Is your codebase getting<br />
          <span className="underline decoration-primary">cleaner or dirtier?</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          DebtLens runs Knip on every push and shows you a historical trend of dead code per repository.
          No CI yaml to write. Install the GitHub App and you&apos;re done.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild size="lg"><Link href="/login">Install GitHub App</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/docs">See how it works</Link></Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Historical Trends</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Line charts showing dead code per commit — unused files, exports, and dependencies tracked separately.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <GitBranch className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Zero Config</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Install the GitHub App and DebtLens automatically analyses every push to your default branch.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Bell className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Spike Alerts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Get notified by email when dead code increases by more than 5% in a single push. Configurable threshold.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-4xl mx-auto" id="pricing">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, transparent pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <div className="text-3xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {['1 repository', '90-day history', 'Email alerts', 'README badge'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{f}</li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant="outline"><Link href="/login">Get started free</Link></Button>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <div className="text-3xl font-bold">$15<span className="text-base font-normal text-muted-foreground">/repo/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {['Unlimited repositories', 'Full history', 'Slack alerts', 'PDF export', 'Knip config override', 'PR diff comments', 'Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{f}</li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full"><Link href="/login">Start with Pro</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DebtLens · Made for engineering teams who care about code quality
      </footer>
    </div>
  );
}
