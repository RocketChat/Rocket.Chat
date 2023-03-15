import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { UserPresenceContext } from '../contexts/UserPresenceContext';
import type { UserPresence } from '../lib/presence';

/**
 * Hook to fetch and subscribe users data
 *
 * @param uid - User Id
 * @returns Users data: status, statusText, username, name
 * @public
 */
export const useUserData = (uid: string): UserPresence | undefined => {
	const userPresence = useContext(UserPresenceContext);

	const { subscribe, get } = useMemo(
		() => userPresence?.queryUserData(uid) ?? { subscribe: () => () => undefined, get: () => undefined },
		[userPresence, uid],
	);

	return useSyncExternalStore(subscribe, get);
};
