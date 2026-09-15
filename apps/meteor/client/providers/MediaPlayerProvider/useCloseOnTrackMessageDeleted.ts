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
	const originMid = track?.originMid;
	const originTs = track?.originTs;

	useEffect(() => {
		if (!rid || !mid) {
			return;
		}

		// The player closes when the message that renders the audio is deleted and, when the audio
		// was played from a quote, when the original message that holds the attachment is deleted.
		const watchedIds = originMid && originMid !== mid ? [mid, originMid] : [mid];

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${rid}/deleteMessage`, ({ _id }) => {
			if (watchedIds.includes(_id)) {
				close();
			}
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${rid}/deleteMessageBulk`, (params) => {
			if (params.ids?.some((id) => watchedIds.includes(id))) {
				close();
				return;
			}

			const matchesCriteria = createDeleteCriteria(params);
			const trackMessage = { _id: mid, rid, ts, pinned, drid, u: { username } } as IMessage;

			if (matchesCriteria(trackMessage)) {
				close();
				return;
			}

			// Only the id and timestamp of the quoted original are known on the client, so the
			// pinned, discussion and author filters cannot be evaluated for it.
			if (originMid && originMid !== mid && originTs && !params.users?.length) {
				const originMessage = { _id: originMid, rid, ts: originTs } as IMessage;

				if (matchesCriteria(originMessage)) {
					close();
				}
			}
		});

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(rid, (message) => {
			if (message.t === 'rm' && watchedIds.includes(message._id)) {
				close();
			}
		});

		return () => {
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
			unsubscribeFromRoomMessages();
		};
	}, [rid, mid, ts, pinned, username, drid, originMid, originTs, subscribeToNotifyRoom, subscribeToRoomMessages, close]);
};
