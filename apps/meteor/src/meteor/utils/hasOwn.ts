export const hasOwn = <T extends Record<PropertyKey, unknown>>(object: T, property: PropertyKey): property is keyof T => Object.hasOwn(object, property);
