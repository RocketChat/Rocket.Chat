import type { IMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';

export const useRefreshTrackFromRoomMessages = (
	track: PersistentAudioTrack | null,
	updateTrack: (next: PersistentAudioTrack) => void,
): void => {
	const subscribeToRoomMessages = useStream('room-messages');

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
