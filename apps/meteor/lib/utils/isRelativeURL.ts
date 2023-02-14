export const isRelativeURL = (str: string): boolean => /^[^\/]+\/[^\/].*$|^\/[^\/].*$/gim.test(str);
