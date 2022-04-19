export const isURL = (str) => /^(https?:\/\/|data:)/.test(str);
export const isRelativeURL = (str) => /^[^\/]+\/[^\/].*$|^\/[^\/].*$/gim.test(str);
