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
	const pinned = track?.pinned;
	const username = track?.username;
	const drid = track?.drid;
	const originMid = track?.originMid;
	const originTs = track?.originTs;
	const originRid = track?.originRid;
	const originPinned = track?.originPinned;
	const originDrid = track?.originDrid;

	useEffect(() => {
		if (!rid || !mid) {
			return;
		}

		const hasOrigin = Boolean(originMid && originMid !== mid);
		// Quotes stored before the origin metadata existed carry only an id and a timestamp. Their
		// original is assumed to live in the quoting room, which is what the player watched before.
		const hasOriginMetadata = Boolean(originRid);
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
		trackWatch.criteria.push({ message: { _id: mid, rid, ts, pinned, drid, u: { username } } as IMessage, isOrigin: false });

		if (hasOrigin && originMid && originRoom) {
			const originWatch = watchRoom(originRoom);
			originWatch.ids.push(originMid);

			if (originTs) {
				originWatch.criteria.push({
					message: {
						_id: originMid,
						rid: originRoom,
						ts: originTs,
						...(hasOriginMetadata && { pinned: originPinned, ...(originDrid && { drid: originDrid }) }),
					} as IMessage,
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

				// The author of a quoted original is not persisted, so a prune filtered by user can
				// never be evaluated for it. Without the origin metadata `pinned` and `drid` are
				// unknown too, and a synthetic message missing them would satisfy `excludePinned`
				// and `ignoreDiscussion`, closing the player for an original the prune spared.
				const canEvaluate = ({ isOrigin }: { isOrigin: boolean }): boolean => {
					if (!isOrigin) {
						return true;
					}

					if (params.users?.length) {
						return false;
					}

					return hasOriginMetadata || (!params.excludePinned && !params.ignoreDiscussion);
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
	}, [
		rid,
		mid,
		ts,
		pinned,
		username,
		drid,
		originMid,
		originTs,
		originRid,
		originPinned,
		originDrid,
		subscribeToNotifyRoom,
		subscribeToRoomMessages,
		close,
	]);
};
