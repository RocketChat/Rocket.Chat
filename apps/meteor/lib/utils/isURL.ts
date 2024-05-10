/**
 * @todo rename it as isAbsoluteURL
 */
export const isURL = (str: string): boolean => /^(https?:\/\/|data:)/.test(str);
