export class UnusedCache {
  private store = new Map<string, unknown>();

  set(key: string, value: unknown) { this.store.set(key, value); }
  get(key: string) { return this.store.get(key); }
  has(key: string) { return this.store.has(key); }
  clear() { this.store.clear(); }
}

export class UnusedLogger {
  private prefix: string;
  constructor(prefix: string) { this.prefix = prefix; }
  log(msg: string) { console.log(`[${this.prefix}] ${msg}`); }
  error(msg: string) { console.error(`[${this.prefix}] ${msg}`); }
}

export function unusedDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function unusedDeepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const UNUSED_REGEX = {
  url: /^https?:\/\/.+/,
  slug: /^[a-z0-9-]+$/,
  hex: /^#[0-9a-fA-F]{6}$/,
};
