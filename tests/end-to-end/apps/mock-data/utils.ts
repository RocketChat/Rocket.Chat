export const createUniqueId = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
export const createRandomPhoneNumber = (): string => `+1${Math.floor(Math.random() * 10000000000)}`;
export const createRandomEmail = (): string => `${createUniqueId()}@test.test`;
