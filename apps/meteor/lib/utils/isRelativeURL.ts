export const isRelativeURL = (str: string): boolean => /^(?![a-z0-9+.-]+:|\/\/).+/i.test(str);

