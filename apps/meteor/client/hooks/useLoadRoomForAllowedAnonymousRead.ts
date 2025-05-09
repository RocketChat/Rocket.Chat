import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CachedChatRoom, CachedChatSubscription } from '../../app/models/client';

export const useLoadRoomForAllowedAnonymousRead = () => {
	const userId = useUserId();
	const accountsAllowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	useEffect(() => {
		if (!userId && accountsAllowAnonymousRead === true) {
			CachedChatRoom.init();
			CachedChatSubscription.ready.set(true);
		}
	}, [accountsAllowAnonymousRead, userId]);
};
