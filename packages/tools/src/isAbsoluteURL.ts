export const isAbsoluteURL = (str: string): boolean => /^(https?:\/\/|data:)/.test(str);
