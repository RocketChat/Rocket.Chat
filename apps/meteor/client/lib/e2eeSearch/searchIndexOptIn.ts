import { searchIndexPreferencesKeyPrefix } from './searchIndexPreferences';
import { absoluteUrl } from '../absoluteUrl';

/** The user's choice to keep a local search index on this device. It is off until the user turns it on. */
const storageKeyPrefix = 'E2EESearch_OptIn_v2_';
// Scoped by workspace and user, in the format that the desktop app keeps when it clears login data.
const storageKey = (userId: string) => `${storageKeyPrefix}${JSON.stringify([absoluteUrl(''), userId])}`;

const listeners = new Set<() => void>();

export const isSearchIndexOptedIn = (userId: string | undefined): boolean => {
	if (!userId) return false;
	try {
		return window.localStorage.getItem(storageKey(userId)) === 'true';
	} catch {
		return false;
	}
};

/** Saves the choice. Returns `false` when the local storage did not take it: the choice then stays as it was. */
export const setSearchIndexOptIn = (userId: string, optedIn: boolean): boolean => {
	let saved = true;
	try {
		if (optedIn) {
			window.localStorage.setItem(storageKey(userId), 'true');
		} else {
			window.localStorage.removeItem(storageKey(userId));
		}
	} catch {
		saved = false;
	}
	for (const listener of [...listeners]) listener();
	return saved;
};

/** A change of the local storage in another tab of this server: a choice there, or a clear (logout) with `key` null. */
const isOptInStorageEvent = (event: StorageEvent): boolean => event.key === null || event.key.startsWith(storageKeyPrefix);

/** Calls the listener each time the choice changes, also in another tab. Returns the function that removes it. */
export const subscribeToSearchIndexOptIn = (listener: () => void): (() => void) => {
	listeners.add(listener);
	const handleStorage = (event: StorageEvent) => {
		if (isOptInStorageEvent(event)) listener();
	};
	window.addEventListener('storage', handleStorage);
	return () => {
		listeners.delete(listener);
		window.removeEventListener('storage', handleStorage);
	};
};

const syncTimeKeyPrefix = 'E2EESearch_SyncedAt_v2_';

/**
 * The time of the last catch-up of every room of the user's index on this device. `namespace` is the server of the
 * index: the servers under the paths of one origin share the local storage.
 */
export const createSearchIndexSyncTimeStore = (namespace: string, getUserId: () => string | undefined) => {
	const keyOf = (userId: string) => `${syncTimeKeyPrefix}${JSON.stringify([namespace, userId])}`;
	return {
		read(): number | undefined {
			const userId = getUserId();
			if (!userId) return undefined;
			try {
				const value = Number(window.localStorage.getItem(keyOf(userId)));
				return Number.isFinite(value) && value > 0 ? value : undefined;
			} catch {
				return undefined;
			}
		},
		write(at: number): void {
			const userId = getUserId();
			if (!userId) return;
			try {
				window.localStorage.setItem(keyOf(userId), String(at));
			} catch {
				// The next open reads no time and indexes the rooms again.
			}
		},
	};
};

const isKeptAtLogout = (key: string, value: string | null) =>
	(key.startsWith(storageKeyPrefix) && value === 'true') ||
	(key.startsWith(syncTimeKeyPrefix) && value !== null) ||
	(key.startsWith(searchIndexPreferencesKeyPrefix) && value !== null);

/**
 * Clears the local storage of this page, but keeps the opt-ins that are on, the catch-up times and the search
 * preferences: the sealed index stays on the device after a logout, and they must stay with it. The kept keys are never
 * removed, not even for a moment: another tab that saw its opt-in go off would wipe the index.
 */
export const clearLocalStorageKeepingSearchIndexOptIns = (): void => {
	const removed: string[] = [];
	try {
		for (let i = 0; i < window.localStorage.length; i++) {
			const key = window.localStorage.key(i);
			if (key !== null && !isKeptAtLogout(key, window.localStorage.getItem(key))) removed.push(key);
		}
	} catch {
		// A local storage that cannot be read is cleared, choices included, which are the safe defaults.
		try {
			window.localStorage.clear();
		} catch {
			// Nothing can be removed.
		}
		return;
	}
	for (const key of removed) {
		try {
			window.localStorage.removeItem(key);
		} catch {
			// The next key can still go.
		}
	}
};
