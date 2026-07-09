export const keys = <T>(value: T): Extract<keyof T, string>[] => Object.keys(Object(value)) as Extract<keyof T, string>[];
