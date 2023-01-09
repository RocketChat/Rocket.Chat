import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { UserPresence } from '../lib/presence';
import { Presence } from '../lib/presence';

/**
 * Hook to fetch and subscribe users presence
 *
 * @param uid - User Id
 * @returns UserPresence
 * @public
 */
export const usePresence = (uid: string | undefined): UserPresence | undefined => {
	const subscribe = useCallback(
		(callback: any): any => {
			uid && Presence.listen(uid, callback);
			return (): void => {
				uid && Presence.stop(uid, callback);
			};
		},
		[uid],
	);

	const getSnapshot = (): UserPresence | undefined => (uid ? Presence.store.get(uid) : undefined);

	return useSyncExternalStore(subscribe, getSnapshot);
};
