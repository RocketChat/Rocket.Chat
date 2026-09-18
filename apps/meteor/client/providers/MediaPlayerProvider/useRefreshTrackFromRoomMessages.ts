import type { IMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';

/**
 * Keeps `pinned` and `drid` in step with the server from the room stream, which — unlike the
 * provider's refresh — does not depend on the owning message being mounted. A prune unmounts it
 * while the room history refetches, and a `deleteMessageBulk` arriving in that window would
 * otherwise be matched against stale state.
 */
export const useRefreshTrackFromRoomMessages = (
	track: PersistentAudioTrack | null,
	updateTrack: (next: PersistentAudioTrack) => void,
): void => {
	const subscribeToRoomMessages = useStream('room-messages');

	// Read through a ref so a refresh does not resubscribe the stream it was caused by.
	const trackRef = useRef<PersistentAudioTrack | null>(track);
	useEffect(() => {
		trackRef.current = track;
	}, [track]);

	const { rid, mid, id } = track ?? {};

	useEffect(() => {
		if (!rid || !mid || !id) {
			return;
		}

		return subscribeToRoomMessages(rid, (message: IMessage) => {
			if (message._id !== mid) {
				return;
			}

			const { current } = trackRef;
			if (current?.id !== id) {
				return;
			}

			updateTrack({ ...current, pinned: message.pinned, drid: message.drid });
		});
	}, [rid, mid, id, subscribeToRoomMessages, updateTrack]);
};
