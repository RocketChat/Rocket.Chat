import { useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { UserPresence, Presence } from '../lib/presence';

/**
 * Hook to fetch and subscribe users data
 *
 * @param uid - User Id
 * @returns Users data: status, statusText, username, name
 * @public
 */
export const useUserData = (uid: string): UserPresence | undefined => {
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
