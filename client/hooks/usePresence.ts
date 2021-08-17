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
export const usePresence = (uid: string): UserPresence | undefined => {
	const subscription = useMemo(
		() => ({
			getCurrentValue: (): UserPresence | undefined => Presence.store.get(uid),
			subscribe: (callback: any): any => {
				Presence.listen(uid, callback);
				return (): void => {
					Presence.stop(uid, callback);
				};
			},
		}),
		[uid],
	);

	return useSubscription(subscription);
};
