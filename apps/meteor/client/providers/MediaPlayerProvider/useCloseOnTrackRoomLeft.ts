import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';

/**
 * Closes the shared player when the listener loses the room the track belongs to, by leaving it or
 * being removed from it. The message is not deleted in that case, so no deletion stream reports it,
 * but the audio is no longer theirs to hear.
 *
 * Audio played from a quote is left alone when the *origin* room goes away: the attachment is
 * embedded in the quoting message, which the listener can still see.
 */
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
