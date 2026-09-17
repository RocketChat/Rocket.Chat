import type { IMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';

/**
 * Keeps the mutable state the delete criteria are matched against in step with the server, from the
 * room stream rather than from the rendered message.
 *
 * The provider refreshes `pinned` while the owning message is mounted, which is not enough on its
 * own: a prune makes the client refetch the room history, and the message is unmounted for as long
 * as that takes. A `deleteMessageBulk` arriving in that window would be matched against whatever
 * the track was last told, so a message pinned moments earlier could still read as unpinned and
 * close a player the prune had spared.
 *
 * Watching the stream closes that window, because it does not depend on anything being rendered.
 */
export const useRefreshTrackFromRoomMessages = (
	track: PersistentAudioTrack | null,
	updateTrack: (next: PersistentAudioTrack) => void,
): void => {
	const subscribeToRoomMessages = useStream('room-messages');

	// Read through a ref so a refresh does not change the effect's inputs and resubscribe the
	// stream on every update it causes.
	const trackRef = useRef<PersistentAudioTrack | null>(track);
	trackRef.current = track;

	const rid = track?.rid;
	const mid = track?.mid;

	useEffect(() => {
		if (!rid || !mid) {
			return;
		}

		return subscribeToRoomMessages(rid, (message: IMessage) => {
			const { current } = trackRef;
			if (!current || message._id !== mid) {
				return;
			}

			updateTrack({ ...current, pinned: message.pinned, drid: message.drid });
		});
	}, [rid, mid, subscribeToRoomMessages, updateTrack]);
};
