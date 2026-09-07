export const isKey = <T extends object>(object: T, key: PropertyKey): key is keyof T => key in object;
