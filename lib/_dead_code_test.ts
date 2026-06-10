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
