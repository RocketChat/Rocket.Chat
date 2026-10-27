export const isAbsoluteURL = (str: string): boolean => /^(https?:\/\/|data:)/i.test(str);
