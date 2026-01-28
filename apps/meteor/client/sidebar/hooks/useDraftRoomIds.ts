import { useSyncExternalStore, useCallback, useRef } from 'react';

const MESSAGEBOX_PREFIX = 'messagebox_';

const areSetsEqual = (a: Set<string>, b: Set<string>): boolean => {
	if (a.size !== b.size) return false;
	for (const item of a) {
		if (!b.has(item)) return false;
	}
	return true;
};

export const useDraftRoomIds = (): Set<string> => {
	const cacheRef = useRef<Set<string>>(new Set());

	const getSnapshot = useCallback(() => {
		if (typeof window === 'undefined' || !window.localStorage) {
			return cacheRef.current;
		}

		const draftRoomIds = new Set<string>();

		try {
			// More efficient: get all keys at once instead of iterating with .key(i)
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (key.startsWith(MESSAGEBOX_PREFIX)) {
					const content = localStorage.getItem(key);
					// Only consider it a draft if it has non-empty content
					if (content?.trim()) {
						const roomId = key.substring(MESSAGEBOX_PREFIX.length);
						draftRoomIds.add(roomId);
					}
				}
			}
		} catch (error) {
			console.error('Error reading drafts from localStorage:', error);
		}

		// Only update cache if the content has actually changed
		if (!areSetsEqual(cacheRef.current, draftRoomIds)) {
			cacheRef.current = draftRoomIds;
		}

		return cacheRef.current;
	}, []);

	const subscribe = useCallback((callback: () => void) => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key?.startsWith(MESSAGEBOX_PREFIX) || e.key === null) {
				callback();
			}
		};

		window.addEventListener('storage', handleStorageChange);

		// Also listen to custom events for same-window updates
		const handleLocalUpdate = (e: Event) => {
			if (e instanceof CustomEvent && e.detail?.key?.startsWith(MESSAGEBOX_PREFIX)) {
				callback();
			}
		};
		window.addEventListener('localStorageUpdated', handleLocalUpdate);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('localStorageUpdated', handleLocalUpdate);
		};
	}, []);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
