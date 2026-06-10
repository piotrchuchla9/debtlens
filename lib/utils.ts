import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

export function deltaColor(delta: number | null): string {
  if (delta === null) return 'text-muted-foreground';
  if (delta > 0) return 'text-red-500';
  if (delta < 0) return 'text-green-500';
  return 'text-muted-foreground';
}

export function deltaLabel(delta: number | null): string {
  if (delta === null) return '—';
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

export function healthColor(total: number): string {
  if (total < 50) return 'text-green-500';
  if (total < 200) return 'text-yellow-500';
  return 'text-red-500';
}

// TEST — unused export, should be detected by scanner
export function neverUsedUtility(x: number, y: number): number {
  return x * y + Math.random();
}
