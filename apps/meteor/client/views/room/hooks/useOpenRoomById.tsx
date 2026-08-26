import { isPublicRoom, type IRoom } from '@rocket.chat/core-typings';
import { getObjectKeys } from '@rocket.chat/tools';
import { useEndpoint, usePermission, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useOpenRoomMutation } from './useOpenRoomMutation';
import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { roomFields } from '../../../../lib/publishFields';
import { SubscriptionsCachedStore } from '../../../cachedStores';
import { RoomManager } from '../../../lib/RoomManager';
import { NotSubscribedToRoomError } from '../../../lib/errors/NotSubscribedToRoomError';
import { RoomNotFoundError } from '../../../lib/errors/RoomNotFoundError';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { mapRoomFromApi } from '../../../lib/utils/mapRoomFromApi';
import { mapSubscriptionFromApi } from '../../../lib/utils/mapSubscriptionFromApi';
import { Rooms, Subscriptions } from '../../../stores';

/**
 * Opens a room by its id, for callers that already know the rid and can't go through the router-driven
 * `useOpenRoom` (which resolves a room by type + name/username).
 */
export function useOpenRoomById(rid: IRoom['_id']) {
	const user = useUser();
	const hasPreviewPermission = usePermission('preview-c-room');
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const getSubscription = useEndpoint('GET', '/v1/subscriptions.getOne');
	const openRoom = useOpenRoomMutation();

	const tryCacheShortcut = useCallback((): { rid: IRoom['_id'] } | undefined => {
		if (!user?._id) {
			return undefined;
		}
		const room = Rooms.state.get(rid);
		if (!room) {
			return undefined;
		}
		const sub = Subscriptions.state.find((record) => record.rid === rid);
		// Sub exists but is closed — must still call openRoom.mutateAsync, so don't shortcut.
		if (sub?.open === false) {
			return undefined;
		}
		return { rid };
	}, [rid, user?._id]);

	return useQuery({
		queryKey: [...roomsQueryKeys.room(rid), 'open', user?._id, user?.username],

		placeholderData: tryCacheShortcut,

		queryFn: async (): Promise<{ rid: IRoom['_id'] }> => {
			const cached = tryCacheShortcut();
			if (cached) {
				const room = Rooms.state.get(rid);
				if (room) {
					const openIdentifier = room.t === 'd' ? rid : room.name;
					if (openIdentifier) {
						LegacyRoomManager.open({ typeName: room.t + openIdentifier, rid });
					}
				}
				return cached;
			}

			let roomData: IRoom | null = null;
			try {
				const result = await getRoomInfo({ roomId: rid });
				roomData = result.room ? mapRoomFromApi(result.room) : null;
			} catch (error) {
				throw new RoomNotFoundError(undefined, { rid });
			}

			if (!roomData?._id) {
				throw new RoomNotFoundError(undefined, { rid });
			}

			const unsetKeys = getObjectKeys(roomData).filter((key) => !(key in roomFields));
			unsetKeys.forEach((key) => {
				delete roomData[key];
			});
			Rooms.state.store(roomData);

			const room = Rooms.state.get(roomData._id);
			if (!room) {
				throw new TypeError('room is undefined');
			}

			// Subscriptions.state may be empty when used without a pre-populating parent (e.g. the conference
			// chat panel). Fetch the subscription as a fallback so openRoom.mutateAsync is not silently skipped.
			let sub = Subscriptions.state.find((record) => record.rid === rid);
			if (!sub) {
				try {
					const subResult = await getSubscription({ roomId: rid });
					if (subResult.subscription) {
						SubscriptionsCachedStore.upsertSubscription(mapSubscriptionFromApi(subResult.subscription));
						sub = Subscriptions.state.find((record) => record.rid === rid);
					}
				} catch {
					// Not subscribed — falls through to the NotSubscribedToRoomError check below.
				}
			}

			if (user && !sub && !hasPreviewPermission && isPublicRoom(room)) {
				throw new NotSubscribedToRoomError(undefined, { rid: room._id });
			}

			// LegacyRoomManager starts the message stream that the composer waits on (via `streamActive`). It
			// resolves the room through `findRoom`, which matches channels/groups by name but DMs by rid (DM
			// rooms have no usable `name`). Passing the wrong identifier leaves the composer stuck loading, so
			// pick per room type.
			const openIdentifier = room.t === 'd' ? rid : room.name;
			if (openIdentifier) {
				LegacyRoomManager.open({ typeName: room.t + openIdentifier, rid });
			}

			if (rid === RoomManager.opened) {
				return { rid };
			}

			if (!!user?._id && sub && !sub.open) {
				await openRoom.mutateAsync({ roomId: rid, userId: user._id });
			}

			return { rid };
		},
		retry: 0,
	});
}
