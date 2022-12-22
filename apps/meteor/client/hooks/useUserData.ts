import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { UserPresence } from '../lib/presence';
import { Presence } from '../lib/presence';

/**
 * Hook to fetch and subscribe users data
 *
 * @param uid - User Id
 * @returns Users data: status, statusText, username, name
 * @public
 */
export const useUserData = (uid: string): UserPresence | undefined => {
	const subscription = useCallback(
		(callback: () => void): (() => void) => {
			Presence.listen(uid, callback);
			return (): void => {
				Presence.stop(uid, callback);
			};
		},
		[uid],
	);

	const getSnapshot = (): UserPresence | undefined => Presence.store.get(uid);

	return useSyncExternalStore(subscription, getSnapshot);
};
