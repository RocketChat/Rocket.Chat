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

export const setSearchIndexOptIn = (userId: string, optedIn: boolean): void => {
	try {
		if (optedIn) {
			window.localStorage.setItem(storageKey(userId), 'true');
		} else {
			window.localStorage.removeItem(storageKey(userId));
		}
	} finally {
		for (const listener of [...listeners]) listener();
	}
};

/** Calls the listener each time the choice changes on this page. Returns the function that removes it. */
export const subscribeToSearchIndexOptIn = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/**
 * Clears the local storage of this page, but keeps each user's choice that is on. A logout clears the local storage,
 * and the sealed index stays on the device after a logout, so the choice must stay with it: without it, the next login
 * reads "off" and wipes the index.
 */
export const clearLocalStorageKeepingSearchIndexOptIns = (): void => {
	const kept: string[] = [];
	try {
		for (let i = 0; i < window.localStorage.length; i++) {
			const key = window.localStorage.key(i);
			if (key?.startsWith(storageKeyPrefix) && window.localStorage.getItem(key) === 'true') kept.push(key);
		}
	} catch {
		// Nothing to keep when the local storage cannot be read.
	}
	window.localStorage.clear();
	for (const key of kept) {
		try {
			window.localStorage.setItem(key, 'true');
		} catch {
			// The choice reads off, which is the safe default.
		}
	}
};
