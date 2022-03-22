import { useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { Presence, UserPresence } from '../lib/presence';

type Presence = 'online' | 'offline' | 'busy' | 'away' | 'loading';

/**
 * Hook to fetch and subscribe users presence
 *
 * @param uid - User Id
 * @returns UserPresence
 * @public
 */
export const usePresence = (uid: string | undefined): UserPresence | undefined => {
	const subscription = useMemo(
		() => ({
			getCurrentValue: (): UserPresence | undefined => (uid ? Presence.store.get(uid) : undefined),
			subscribe: (callback: any): any => {
				uid && Presence.listen(uid, callback);
				return (): void => {
					uid && Presence.stop(uid, callback);
				};
			},
		}),
		[uid],
	);

	return useSubscription(subscription);
};
