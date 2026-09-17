import { useCallback, useSyncExternalStore } from 'react';

import type { StorageKey } from '../lib/sdk/storage';
import { getStoredItem, subscribeStoredItem } from '../lib/sdk/storage';

const getServerSnapshot = (): string | null => null;

/**
 * Reads a value out of the client-side persistent storage, and re-renders when it changes.
 *
 * `getStoredItem` on its own is a plain `localStorage` read: a component that calls it during render picks up a
 * write only if something *else* it subscribes to changes at the same time. Where the stored value is what
 * decides the render — `AuthenticationCheck` reading the login token — that coincidence is not something to
 * depend on, hence this.
 *
 * The snapshot is the stored string itself, so React's `Object.is` bail-out compares it by value and a `notify`
 * for some other key costs nothing beyond the read.
 */
export const useStoredItem = (key: StorageKey): string | null =>
	useSyncExternalStore(
		subscribeStoredItem,
		useCallback(() => getStoredItem(key), [key]),
		getServerSnapshot,
	);
