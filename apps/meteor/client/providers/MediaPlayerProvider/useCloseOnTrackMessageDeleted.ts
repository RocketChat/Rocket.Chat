import type { IMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { createDeleteCriteria } from '../../lib/utils/threadMessageUtils';

export const useCloseOnTrackMessageDeleted = (track: PersistentAudioTrack | null, close: () => void): void => {
	const subscribeToNotifyRoom = useStream('notify-room');
	const subscribeToRoomMessages = useStream('room-messages');

	const rid = track?.rid;
	const mid = track?.mid;
	const ts = track?.ts;
	const pinned = track?.pinned;
	const username = track?.username;
	const drid = track?.drid;

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
			const trackMessage = { _id: mid, rid, ts, pinned, drid, u: { username } } as IMessage;

			if (params.ids?.includes(mid) || matchesCriteria(trackMessage)) {
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
	}, [rid, mid, ts, pinned, username, drid, subscribeToNotifyRoom, subscribeToRoomMessages, close]);
};
