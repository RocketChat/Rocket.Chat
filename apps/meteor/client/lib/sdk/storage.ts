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

const getStorage = (): Storage | undefined => {
	if (typeof window === 'undefined') {
		return undefined;
	}

	try {
		return storageBackend === 'session' ? window.sessionStorage : window.localStorage;
	} catch {
		return undefined;
	}
};

export const getStoredItem = (key: string): string | null => getStorage()?.getItem(key) ?? null;

export const setStoredItem = (key: string, value: string): void => getStorage()?.setItem(key, value);

export const removeStoredItem = (key: string): void => getStorage()?.removeItem(key);

type StorageBackend = 'local' | 'session';

let storageBackend: StorageBackend = 'local';

export const setStorageBackend = (backend: StorageBackend): void => {
	moveLoginKeys(backend);
	storageBackend = backend;
};

const moveLoginKeys = (backend: StorageBackend): void => {
	if (typeof window === 'undefined') {
		return;
	}

	const keys = [
		STORAGE_KEYS.USER_ID,
		STORAGE_KEYS.LOGIN_TOKEN,
		STORAGE_KEYS.LOGIN_TOKEN_EXPIRES,
		STORAGE_KEYS.E2EE_PUBLIC_KEY,
		STORAGE_KEYS.E2EE_PRIVATE_KEY,
		STORAGE_KEYS.E2EE_RANDOM_PASSWORD,
	];

	const sourceStorage = backend === 'session' ? window.localStorage : window.sessionStorage;
	const targetStorage = backend === 'session' ? window.sessionStorage : window.localStorage;

	for (const key of keys) {
		const value = sourceStorage.getItem(key);
		if (value === null) {
			continue;
		}

		targetStorage.setItem(key, value);
		sourceStorage.removeItem(key);
	}
};
