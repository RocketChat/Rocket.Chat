import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';

export const useCloseOnTrackMessageDeleted = (track: PersistentAudioTrack | null, close: () => void): void => {
	const subscribeToNotifyRoom = useStream('notify-room');
	const subscribeToRoomMessages = useStream('room-messages');

	const rid = track?.rid;
	const mid = track?.mid;
	const originMid = track?.originMid;

	useEffect(() => {
		if (!rid || !mid) {
			return;
		}

		const watchedIds = originMid ? [mid, originMid] : [mid];

		const unsubscribers = [
			subscribeToNotifyRoom(`${rid}/deleteMessage`, ({ _id }) => {
				if (watchedIds.includes(_id)) {
					close();
				}
			}),
			subscribeToNotifyRoom(`${rid}/deleteMessageBulk`, ({ ids }) => {
				if (ids?.some((id) => watchedIds.includes(id))) {
					close();
				}
			}),
			subscribeToRoomMessages(rid, (message) => {
				if (message.t === 'rm' && watchedIds.includes(message._id)) {
					close();
				}
			}),
		];

		return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
	}, [rid, mid, originMid, subscribeToNotifyRoom, subscribeToRoomMessages, close]);
};
