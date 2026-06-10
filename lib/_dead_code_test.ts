// TEST FILE — never imported anywhere, should appear as "unused file"

export function neverCalledHelper(input: string): string {
  return input.toUpperCase();

  
}

export const UNUSED_CONSTANT = 42;

export class UnusedClass {
  greet() {
    return 'hello';
  }
}

export function alertTestFunction1(): string {
  return 'alert test 1';
}

export function alertTestFunction2(x: number): number {
  return x + 1;
}

export function prTestFunction1(a: string, b: string): string {
  return a + b;
}

export function prTestFunction2(items: number[]): number {
  return items.reduce((acc, n) => acc + n, 0);
}

export const PR_TEST_CONSTANT = 'never used in pr test';

export class PRTestClass {
  private value: number;
  constructor(v: number) { this.value = v; }
  getValue() { return this.value; }
}
