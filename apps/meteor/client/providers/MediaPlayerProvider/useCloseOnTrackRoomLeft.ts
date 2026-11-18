import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';

export const useCloseOnTrackRoomLeft = (track: PersistentAudioTrack | null, close: () => void): void => {
	const subscribeToNotifyUser = useStream('notify-user');
	const userId = useUserId();

	const rid = track?.rid;

	useEffect(() => {
		if (!userId || !rid) {
			return;
		}

		return subscribeToNotifyUser(`${userId}/subscriptions-changed`, (event, subscription) => {
			if (event === 'removed' && subscription.rid === rid) {
				close();
			}
		});
	}, [userId, rid, subscribeToNotifyUser, close]);
};
