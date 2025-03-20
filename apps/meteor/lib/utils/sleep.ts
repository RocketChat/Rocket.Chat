// Promisified sleep function
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
