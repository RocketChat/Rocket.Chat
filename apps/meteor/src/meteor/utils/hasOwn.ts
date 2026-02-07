export const hasOwn = <T extends object>(object: T, property: PropertyKey): property is keyof T => Object.hasOwn(object, property);
