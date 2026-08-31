export const isTruthy = <T>(x: T | null | undefined | 0 | false | ''): x is T => Boolean(x);
