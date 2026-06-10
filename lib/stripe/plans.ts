export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxRepos: 1,
    historyDays: 90,
    manualScanCooldownMs: 10 * 60 * 1000,
    slackAlerts: false,
    features: ['1 repository', '90-day history', 'README badge', 'Manual scans', 'JS / TS / Python / Go'],
  },
  pro: {
    name: 'Pro',
    price: 35,
    maxRepos: Infinity,
    historyDays: Infinity,
    manualScanCooldownMs: 60 * 1000,
    slackAlerts: true,
    features: [
      'Unlimited repositories',
      'Full history',
      'Slack spike alerts',
      'Knip config override',
      'Team & org access',
      'Priority support',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
