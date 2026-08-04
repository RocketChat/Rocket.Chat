import type { IUser } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { RoomHistoryManager } from '../../../../app/ui-utils/client';

export const useClearRemovedRoomsHistory = (userId: IUser['_id'] | undefined) => {
	const subscribeToNotifyUser = useStream('notify-user');
	useEffect(() => {
		if (!userId) {
			return;
		}

		return subscribeToNotifyUser(`${userId}/subscriptions-changed`, (event, data) => {
			if (data.t !== 'l' && event === 'removed' && data.rid) {
				RoomHistoryManager.clear(data.rid);
			}
		});
	}, [userId, subscribeToNotifyUser]);
};
