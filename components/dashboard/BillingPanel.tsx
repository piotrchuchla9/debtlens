'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS } from '@/lib/stripe/plans';

interface BillingPanelProps {
  plan: 'free' | 'pro';
  hasStripeCustomer: boolean;
  repoCount: number;
}

export function BillingPanel({ plan, hasStripeCustomer, repoCount }: BillingPanelProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? 'Failed to start checkout');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? 'Failed to open portal');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge variant={plan === 'pro' ? 'default' : 'secondary'}>
              {plan === 'pro' ? 'Pro' : 'Free'}
            </Badge>
          </div>
          <CardDescription>
            {repoCount} {repoCount === 1 ? 'repository' : 'repositories'} connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm mb-6">
            {PLANS[plan].features.map(f => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {plan === 'free' ? (
            <Button onClick={handleCheckout} disabled={loading}>
              {loading ? 'Redirecting...' : 'Upgrade to Pro — $15/repo/month'}
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePortal} disabled={loading}>
              {loading ? 'Redirecting...' : 'Manage subscription'}
            </Button>
          )}
        </CardContent>
      </Card>

      {plan === 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pro Plan — $15/repo/month</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {PLANS.pro.features.map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
