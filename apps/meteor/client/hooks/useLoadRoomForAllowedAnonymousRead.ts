import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { RoomsCachedStore, SubscriptionsCachedStore } from '../cachedStores';

export const useLoadRoomForAllowedAnonymousRead = () => {
	const userId = useUserId();
	const accountsAllowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	useEffect(() => {
		if (!userId && accountsAllowAnonymousRead === true) {
			RoomsCachedStore.init();
			SubscriptionsCachedStore.setReady(true);
			return () => {
				RoomsCachedStore.setReady(false);
				SubscriptionsCachedStore.setReady(false);
			};
		}
	}, [accountsAllowAnonymousRead, userId]);
};
