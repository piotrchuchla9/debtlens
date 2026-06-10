export function unusedFormatter(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function unusedValidator(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function unusedCalculator(a: number, b: number, op: string): number {
  if (op === 'add') return a + b;
  if (op === 'sub') return a - b;
  if (op === 'mul') return a * b;
  return a / b;
}

export const UNUSED_CONFIG = {
  apiUrl: 'https://example.com',
  timeout: 3000,
  retries: 5,
};

export type UnusedStatus = 'active' | 'inactive' | 'pending' | 'deleted';

export interface UnusedPayload {
  id: string;
  status: UnusedStatus;
  createdAt: Date;
}
