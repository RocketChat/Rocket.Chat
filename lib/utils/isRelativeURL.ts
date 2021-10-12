export const isRelativeURL = (str: string): boolean => /^[^\/]+\/[^\/].*$|^\/[^\/].*$/gmi.test(str);
