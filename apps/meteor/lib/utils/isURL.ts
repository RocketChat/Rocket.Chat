export const isAbsoluteURL = (str: string): boolean => /^(https?:\/\/|data:)/.test(str);

/** @deprecated use isAbsoluteURL */
export const isURL = isAbsoluteURL;
