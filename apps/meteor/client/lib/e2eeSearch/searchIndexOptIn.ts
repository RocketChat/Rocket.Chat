/**
 * The user's choice to keep a local search index of their encrypted messages on this device. It is stored on the
 * device only (each device decides for itself), for each user, and it is off until the user turns it on.
 */
const storageKey = (userId: string) => `E2EESearch_OptIn_${userId}`;

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
