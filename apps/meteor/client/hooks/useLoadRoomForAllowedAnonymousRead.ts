import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CachedChatRoom } from '../../app/models/client';
import { SubscriptionsCachedStore } from '../cachedStores';

export const useLoadRoomForAllowedAnonymousRead = () => {
	const userId = useUserId();
	const accountsAllowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	useEffect(() => {
		if (!userId && accountsAllowAnonymousRead === true) {
			CachedChatRoom.init();
			SubscriptionsCachedStore.ready.set(true);
			return () => {
				CachedChatRoom.ready.set(false);
				SubscriptionsCachedStore.ready.set(false);
			};
		}
	}, [accountsAllowAnonymousRead, userId]);
};
