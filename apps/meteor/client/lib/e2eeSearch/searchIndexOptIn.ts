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
 * the messages. An unknown time makes the next open index the rooms again, which is the safe default.
 */
export const createSearchIndexSyncTimeStore = (getUserId: () => string | undefined) => ({
	read(): number | undefined {
		const userId = getUserId();
		if (!userId) return undefined;
		try {
			const value = Number(window.localStorage.getItem(`${syncTimeKeyPrefix}${userId}`));
			return Number.isFinite(value) && value > 0 ? value : undefined;
		} catch {
			return undefined;
		}
	},
	write(at: number): void {
		const userId = getUserId();
		if (!userId) return;
		try {
			window.localStorage.setItem(`${syncTimeKeyPrefix}${userId}`, String(at));
		} catch {
			// The next open reads no time and indexes the rooms again.
		}
	},
});

const isKeptAtLogout = (key: string, value: string | null) =>
	(key.startsWith(storageKeyPrefix) && value === 'true') || (key.startsWith(syncTimeKeyPrefix) && value !== null);

/**
 * Clears the local storage of this page, but keeps each user's choice that is on and the catch-up time of each index. A
 * logout clears the local storage, and the sealed index stays on the device after a logout, so both must stay with it:
 * without the choice, the next login reads "off" and wipes the index, and without the time, it indexes every room again.
 */
export const clearLocalStorageKeepingSearchIndexOptIns = (): void => {
	const kept: [string, string][] = [];
	try {
		for (let i = 0; i < window.localStorage.length; i++) {
			const key = window.localStorage.key(i);
			const value = key === null ? null : window.localStorage.getItem(key);
			if (key !== null && value !== null && isKeptAtLogout(key, value)) kept.push([key, value]);
		}
	} catch {
		// Nothing to keep when the local storage cannot be read.
	}
	try {
		window.localStorage.clear();
	} catch {
		return;
	}
	for (const [key, value] of kept) {
		try {
			window.localStorage.setItem(key, value);
		} catch {
			// The choice reads off and the time reads unknown, which are the safe defaults.
		}
	}
};
