// Single point of access to the client-side persistent storage that
// Rocket.Chat shares with Meteor's accounts-base. Reads and writes use
// window.localStorage under the hood; the keys mirror the names Meteor
// originally wrote so sessions persist across the Meteor → SDK migration.

export const STORAGE_KEYS = {
	USER_ID: 'Meteor.userId',
	LOGIN_TOKEN: 'Meteor.loginToken',
	LOGIN_TOKEN_EXPIRES: 'Meteor.loginTokenExpires',
	E2EE_PUBLIC_KEY: 'public_key',
	E2EE_PRIVATE_KEY: 'private_key',
	E2EE_RANDOM_PASSWORD: 'e2e.randomPassword',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const getStorage = (): Storage | undefined => (typeof window !== 'undefined' ? window.localStorage : undefined);

export const getStoredItem = (key: string): string | null => getStorage()?.getItem(key) ?? null;

export const setStoredItem = (key: string, value: string): void => getStorage()?.setItem(key, value);

export const removeStoredItem = (key: string): void => getStorage()?.removeItem(key);
