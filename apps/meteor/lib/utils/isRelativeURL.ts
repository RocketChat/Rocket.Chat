export const isRelativeURL = (str: string): boolean => typeof str === 'string' && !/^[a-z][a-z0-9+.-]*:/i.test(str) && !str.startsWith('//');
