export function anotherDeadFunction(x: number): number {
  return x * 2;
}

export const ANOTHER_UNUSED_CONSTANT = 'never used';

export interface UnusedInterface {
  name: string;
  value: number;
}

export type UnusedType = 'a' | 'b' | 'c';
