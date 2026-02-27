import { useSyncExternalStore, useCallback, useRef } from 'react';

const MESSAGEBOX_PREFIX = 'messagebox_';

const areSetsEqual = (a: Set<string>, b: Set<string>): boolean => {
	if (a.size !== b.size) return false;
	for (const item of a) {
		if (!b.has(item)) return false;
	}
	return true;
};

const emptySet = new Set<string>();

export const useDraftRoomIds = (enabled = true): Set<string> => {
	const cacheRef = useRef<Set<string>>(new Set());

	const getSnapshot = useCallback(() => {
		if (!enabled) {
			return emptySet;
		}

		if (typeof window === 'undefined' || !window.localStorage) {
			return cacheRef.current;
		}

		const draftRoomIds = new Set<string>();

		try {
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (!key.startsWith(MESSAGEBOX_PREFIX)) {
					continue;
				}

				const content = localStorage.getItem(key);
				if (!content?.trim()) {
					continue;
				}

				const roomId = key.substring(MESSAGEBOX_PREFIX.length);
				draftRoomIds.add(roomId);
			}
		} catch (error) {
			console.error('Error reading drafts from localStorage:', error);
		}

		if (!areSetsEqual(cacheRef.current, draftRoomIds)) {
			cacheRef.current = draftRoomIds;
		}

		return cacheRef.current;
	}, [enabled]);

	const subscribe = useCallback((callback: () => void) => {
		if (!enabled) {
			return () => {};
		}

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key?.startsWith(MESSAGEBOX_PREFIX) || e.key === null) {
				callback();
			}
		};

		window.addEventListener('storage', handleStorageChange);

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
	}, [enabled]);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
