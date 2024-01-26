import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { RoomHistoryManager } from '../../../../app/ui-utils/client';

export const useClearRemovedRoomsHistory = (userId: string | null) => {
	const subscribeToNotifyUser = useStream('notify-user');

	useEffect(() => {
		if (!userId) {
			return;
		}

		return subscribeToNotifyUser(`${userId}/subscriptions-changed`, (event, data) => {
			if (event === 'removed' && data.rid) {
				RoomHistoryManager.clear(data.rid);
			}
		});
	}, [userId, subscribeToNotifyUser]);
};
