export const isKey = <T extends object>(x: T, k: PropertyKey): k is keyof T => k in x;
