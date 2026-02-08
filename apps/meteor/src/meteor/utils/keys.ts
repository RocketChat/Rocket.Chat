export const keys = <T>(value: T): (keyof T)[] => Object.keys(Object(value)) as (keyof T)[];
