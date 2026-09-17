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
	const id = track?.id;

	useEffect(() => {
		if (!rid || !mid || !id) {
			return;
		}

		return subscribeToRoomMessages(rid, (message: IMessage) => {
			if (message._id !== mid) {
				return;
			}

			const { current } = trackRef;
			// The ref is written during render, so between a track being swapped and this
			// subscription being torn down it already points at the new track while this callback
			// still belongs to the old one. Without this the previous message's state would be
			// written onto a different track — `updateTrack`'s own id check cannot catch it,
			// because the patch carries the id of whatever `current` is.
			if (!current || current.id !== id) {
				return;
			}

			updateTrack({ ...current, pinned: message.pinned, drid: message.drid });
		});
	}, [rid, mid, id, subscribeToRoomMessages, updateTrack]);
};
