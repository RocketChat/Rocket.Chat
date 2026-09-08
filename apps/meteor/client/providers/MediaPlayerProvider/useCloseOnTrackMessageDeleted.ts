import type { IMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { createDeleteCriteria } from '../../lib/utils/threadMessageUtils';

/**
 * Closes the shared audio player when the message that owns the currently
 * loaded track is deleted, either individually or through a bulk/prune
 * operation. Runs regardless of playback state, so a paused player is
 * closed too.
 */
export const useCloseOnTrackMessageDeleted = (track: PersistentAudioTrack | null, close: () => void): void => {
	const subscribeToNotifyRoom = useStream('notify-room');
	const subscribeToRoomMessages = useStream('room-messages');

	const rid = track?.rid;
	const mid = track?.mid;
	const ts = track?.ts;
	const pinned = track?.pinned;
	const username = track?.username;

	useEffect(() => {
		if (!rid || !mid) {
			return;
		}

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${rid}/deleteMessage`, ({ _id }) => {
			if (_id === mid) {
				close();
			}
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${rid}/deleteMessageBulk`, (params) => {
			const matchesCriteria = createDeleteCriteria(params);
			const trackMessage = { _id: mid, rid, ts, pinned, u: { username } } as IMessage;

			if (matchesCriteria(trackMessage)) {
				close();
			}
		});

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(rid, (message) => {
			if (message._id === mid && message.t === 'rm') {
				close();
			}
		});

		return () => {
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
			unsubscribeFromRoomMessages();
		};
	}, [rid, mid, ts, pinned, username, subscribeToNotifyRoom, subscribeToRoomMessages, close]);
};
