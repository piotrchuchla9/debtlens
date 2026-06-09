export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxRepos: 1,
    historyDays: 90,
    manualScanCooldownMs: 10 * 60 * 1000,
    features: ['1 repository', '90-day history', 'Email alerts', 'README badge'],
  },
  pro: {
    name: 'Pro',
    price: 15,
    maxRepos: Infinity,
    historyDays: Infinity,
    manualScanCooldownMs: 60 * 1000,
    features: [
      'Unlimited repositories',
      'Full history',
      'Email + Slack alerts',
      'PDF export',
      'Knip config override',
      'PR diff comments',
      'Priority support',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
