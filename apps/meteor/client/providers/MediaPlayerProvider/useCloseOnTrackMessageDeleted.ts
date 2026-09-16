import type { IMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { createDeleteCriteria } from '../../lib/utils/threadMessageUtils';

/** A message the player watches, and the room whose deletion events can remove it. */
type RoomWatch = {
	ids: string[];
	criteria: { message: IMessage; isOrigin: boolean }[];
};

export const useCloseOnTrackMessageDeleted = (track: PersistentAudioTrack | null, close: () => void): void => {
	const subscribeToNotifyRoom = useStream('notify-room');
	const subscribeToRoomMessages = useStream('room-messages');

	const rid = track?.rid;
	const mid = track?.mid;
	const ts = track?.ts;
	const username = track?.username;
	const drid = track?.drid;
	const originMid = track?.originMid;
	const originTs = track?.originTs;
	const originRid = track?.originRid;

	useEffect(() => {
		if (!rid || !mid) {
			return;
		}

		const hasOrigin = Boolean(originMid && originMid !== mid);
		// Quotes stored before the origin room existed carry only an id and a timestamp. Their
		// original is assumed to live in the quoting room, which is what the player watched before.
		const originRoom = hasOrigin ? (originRid ?? rid) : undefined;

		const watches = new Map<string, RoomWatch>();
		const watchRoom = (roomId: string): RoomWatch => {
			const existing = watches.get(roomId);
			if (existing) {
				return existing;
			}

			const created: RoomWatch = { ids: [], criteria: [] };
			watches.set(roomId, created);
			return created;
		};

		const trackWatch = watchRoom(rid);
		trackWatch.ids.push(mid);
		trackWatch.criteria.push({ message: { _id: mid, rid, ts, drid, u: { username } } as IMessage, isOrigin: false });

		if (hasOrigin && originMid && originRoom) {
			const originWatch = watchRoom(originRoom);
			originWatch.ids.push(originMid);

			if (originTs) {
				originWatch.criteria.push({
					message: { _id: originMid, rid: originRoom, ts: originTs } as IMessage,
					isOrigin: true,
				});
			}
		}

		const unsubscribers = [...watches].flatMap(([roomId, { ids, criteria }]) => [
			subscribeToNotifyRoom(`${roomId}/deleteMessage`, ({ _id }) => {
				if (ids.includes(_id)) {
					close();
				}
			}),

			subscribeToNotifyRoom(`${roomId}/deleteMessageBulk`, (params) => {
				if (params.ids?.some((id) => ids.includes(id))) {
					close();
					return;
				}

				const matchesCriteria = createDeleteCriteria(params);

				// `pinned` flips over a message's lifetime and every copy the player holds is a
				// snapshot: the active track is only replaced when its id changes, and a stored quote
				// attachment is never rewritten. Matching a stale value against `pinned: { $ne: true }`
				// would close the player for a message the prune spared, so no prune filtering on it is
				// evaluated. A deletion naming the message by id still closes it either way.
				//
				// `drid` is different: a message is created with its discussion id and never gains or
				// loses one, so the snapshot cannot go stale and `ignoreDiscussion` stays matchable for
				// the playing message. A quoted original carries neither its author nor its `drid`, so
				// both of those filters remain unanswerable for it.
				const canEvaluate = ({ isOrigin }: { isOrigin: boolean }): boolean => {
					if (params.excludePinned) {
						return false;
					}

					if (!isOrigin) {
						return true;
					}

					return !params.users?.length && !params.ignoreDiscussion;
				};

				if (criteria.some((entry) => canEvaluate(entry) && matchesCriteria(entry.message))) {
					close();
				}
			}),

			subscribeToRoomMessages(roomId, (message) => {
				if (message.t === 'rm' && ids.includes(message._id)) {
					close();
				}
			}),
		]);

		return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
	}, [rid, mid, ts, username, drid, originMid, originTs, originRid, subscribeToNotifyRoom, subscribeToRoomMessages, close]);
};
