/**
 * The user's choice to keep a local search index of their encrypted messages on this device. It is stored on the
 * device only (each device decides for itself), for each user, and it is off until the user turns it on.
 */
const storageKeyPrefix = 'E2EESearch_OptIn_';
const storageKey = (userId: string) => `${storageKeyPrefix}${userId}`;

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

/**
 * Calls the listener each time the choice changes, on this page or in another tab of this server. Returns the function
 * that removes it.
 */
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

const syncTimeKeyPrefix = 'E2EESearch_SyncedAt_';

/**
 * The time of the last catch-up of every room of the user's index on this device. It is a time only, with nothing of
 * the messages. An unknown time makes the next open index the rooms again, which is the safe default. `namespace` is the
 * server of the index: the servers under the paths of one origin share the local storage, and each has its own index.
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
	(key.startsWith(storageKeyPrefix) && value === 'true') || (key.startsWith(syncTimeKeyPrefix) && value !== null);

/**
 * Clears the local storage of this page, but keeps each user's choice that is on and the catch-up time of each index. A
 * logout clears the local storage, and the sealed index stays on the device after a logout, so both must stay with it:
 * without the choice, the next login reads "off" and wipes the index, and without the time, it indexes every room again.
 * The kept keys are never removed, also not for a moment: another tab that saw its choice go off would wipe the index.
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
