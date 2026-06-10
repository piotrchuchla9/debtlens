export function yetAnotherUnused(): void {
  console.log('this is never called');
}

export const DEAD_CONFIG = {
  timeout: 5000,
  retries: 3,
};
