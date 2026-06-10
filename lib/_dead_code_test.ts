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
