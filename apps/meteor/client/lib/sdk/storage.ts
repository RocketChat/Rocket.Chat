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

type StorageBackend = 'local' | 'session';

const getStorageForBackend = (backend: StorageBackend): Storage | undefined => {
	if (typeof window === 'undefined') {
		return undefined;
	}

	try {
		return backend === 'session' ? window.sessionStorage : window.localStorage;
	} catch {
		return undefined;
	}
};

const getStorage = (): Storage | undefined => {
	return getStorageForBackend(storageBackend);
};

export const getStoredItem = (key: StorageKey): string | null => getStorage()?.getItem(key) ?? null;

export const setStoredItem = (key: StorageKey, value: string): void => getStorage()?.setItem(key, value);

export const removeStoredItem = (key: StorageKey): void => getStorage()?.removeItem(key);

let storageBackend: StorageBackend = 'local';

export const setStorageBackend = (backend: StorageBackend): boolean => {
	if (backend === storageBackend) {
		return true;
	}

	if (!moveLoginKeys(backend)) {
		return false;
	}

	storageBackend = backend;
	return true;
};

const moveLoginKeys = (backend: StorageBackend): boolean => {
	const keys = [
		STORAGE_KEYS.USER_ID,
		STORAGE_KEYS.LOGIN_TOKEN,
		STORAGE_KEYS.LOGIN_TOKEN_EXPIRES,
		STORAGE_KEYS.E2EE_PUBLIC_KEY,
		STORAGE_KEYS.E2EE_PRIVATE_KEY,
		STORAGE_KEYS.E2EE_RANDOM_PASSWORD,
	];

	const sourceStorage = getStorageForBackend(backend === 'session' ? 'local' : 'session');
	const targetStorage = getStorageForBackend(backend);

	if (!sourceStorage || !targetStorage) {
		console.warn('Unable to switch storage backend because source or target storage is unavailable');
		return false;
	}

	for (const key of keys) {
		let value: string | null;
		try {
			value = sourceStorage.getItem(key);
		} catch {
			continue;
		}

		if (value === null) {
			continue;
		}

		try {
			targetStorage.setItem(key, value);
			sourceStorage.removeItem(key);
		} catch {
			continue;
		}
	}
	sourceStorage.clear();

	return true;
};
