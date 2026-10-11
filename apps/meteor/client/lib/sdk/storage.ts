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

/**
 * A same-tab write to `localStorage` announces itself to nobody: the DOM `storage` event is only ever delivered
 * to the *other* tabs. Anything that renders from a stored value — the session-resume gate in
 * `AuthenticationCheck` above all — therefore has to be told, or it reads a stale value and keeps it until some
 * unrelated state change happens to render it again. Every mutation below goes through `notify`, and
 * `subscribeStoredItem` is what `useSyncExternalStore` consumers hook into.
 *
 * The `storage` event is the other half of that, and covers exactly the writes `notify` cannot see: a logout in
 * another tab takes the token out from under a window that is still resuming, and that window has no other way
 * to hear about it. `ensureConnectedAndAuthenticated` reads the token only once it has a connection, so a token
 * that left in the meantime makes it return without a user, without clearing anything, and without a resume to
 * fail — leaving a gate that never re-renders sitting on a token that is no longer there.
 */
const listeners = new Set<() => void>();

const notify = (): void => {
	for (const listener of listeners) {
		listener();
	}
};

/**
 * Attached with the first subscriber and dropped with the last, so imperative readers pay nothing for it. The
 * event is not filtered by key or by storage area: `notify` is keyless anyway, and a subscriber that reads a
 * key nobody touched re-reads an unchanged snapshot, which React discards.
 */
const handleStorageEvent = (): void => {
	notify();
};

export const subscribeStoredItem = (listener: () => void): (() => void) => {
	if (listeners.size === 0 && typeof window !== 'undefined') {
		window.addEventListener('storage', handleStorageEvent);
	}

	listeners.add(listener);

	return () => {
		listeners.delete(listener);

		if (listeners.size === 0 && typeof window !== 'undefined') {
			window.removeEventListener('storage', handleStorageEvent);
		}
	};
};

export const getStoredItem = (key: StorageKey): string | null => getStorage()?.getItem(key) ?? null;

export const setStoredItem = (key: StorageKey, value: string): void => {
	getStorage()?.setItem(key, value);
	notify();
};

export const removeStoredItem = (key: StorageKey): void => {
	getStorage()?.removeItem(key);
	notify();
};

let storageBackend: StorageBackend = 'local';

export const setStorageBackend = (backend: StorageBackend): boolean => {
	if (backend === storageBackend) {
		return true;
	}

	if (!moveLoginKeys(backend)) {
		return false;
	}

	storageBackend = backend;
	notify();
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
