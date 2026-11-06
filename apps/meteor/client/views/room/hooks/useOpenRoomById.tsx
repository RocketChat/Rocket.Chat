import { isPublicRoom, type IRoom } from '@rocket.chat/core-typings';
import { getObjectKeys } from '@rocket.chat/tools';
import { useEndpoint, usePermission, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useOpenRoomMutation } from './useOpenRoomMutation';
import { roomFields } from '../../../../lib/publishFields';
import { SubscriptionsCachedStore } from '../../../cachedStores';
import { LegacyRoomManager } from '../../../lib/LegacyRoomManager';
import { RoomManager } from '../../../lib/RoomManager';
import { NotSubscribedToRoomError } from '../../../lib/errors/NotSubscribedToRoomError';
import { RoomNotFoundError } from '../../../lib/errors/RoomNotFoundError';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { isRefusal } from '../../../lib/utils/isRefusal';
import { mapRoomFromApi } from '../../../lib/utils/mapRoomFromApi';
import { mapSubscriptionFromApi } from '../../../lib/utils/mapSubscriptionFromApi';
import { Rooms, Subscriptions } from '../../../stores';

/**
 * Whether this room's type is looked up by id rather than by name.
 *
 * `findRoom` matches channels and groups by name, but a direct room has no usable one and an omnichannel room is
 * fetched by id outright — so for those two the identifier is the rid.
 */
const isRoomFoundById = (room: IRoom): boolean => room.t === 'd' || room.t === 'l';

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
		// No subscription is not the same as an open one: shortcutting here would skip both the fallback fetch and
		// the `NotSubscribedToRoomError` check below, and hand a cached public room to someone with no access to
		// it — which for the conference chat panel means silently showing a chat instead of the way to share it.
		// A closed subscription can't shortcut either, since `openRoom.mutateAsync` still has to run.
		if (!sub || sub.open === false) {
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
					const openIdentifier = isRoomFoundById(room) ? rid : room.name;
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
				// `rooms.info` reports a missing room and an unreadable one as the same refusal, and the not-found
				// screen is the right answer to both. A request that never arrived is not an answer about the room,
				// so it is left to the retry below rather than reported as a room that does not exist.
				if (!isRefusal(error)) {
					throw error;
				}

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
			//
			// Not caught: having no subscription is an answer this endpoint gives as `subscription: null`, never as
			// a failure. So a failure here is the request not arriving, and reading that as "not subscribed" put a
			// public room's chat behind the screen explaining it was never shared with this user.
			let sub = Subscriptions.state.find((record) => record.rid === rid);
			if (!sub && user?._id) {
				const subResult = await getSubscription({ roomId: rid });
				if (subResult.subscription) {
					SubscriptionsCachedStore.upsertSubscription(mapSubscriptionFromApi(subResult.subscription));
					sub = Subscriptions.state.find((record) => record.rid === rid);
				}
			}

			if (user && !sub && !hasPreviewPermission && isPublicRoom(room)) {
				throw new NotSubscribedToRoomError(undefined, { rid: room._id });
			}

			// LegacyRoomManager starts the message stream that the composer waits on (via `streamActive`). It
			// resolves the room through `findRoom`, and passing the wrong identifier leaves the composer stuck
			// loading, so pick per room type.
			const openIdentifier = isRoomFoundById(room) ? rid : room.name;
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
		// The same shape as `useOpenRoom`'s: the answers about the room itself are final, and everything else is
		// the server not having answered — which is worth asking again before the panel says the room is gone.
		retry: (failureCount, error) => {
			if (error instanceof RoomNotFoundError || error instanceof NotSubscribedToRoomError) {
				return false;
			}

			return failureCount < 4;
		},
		retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
	});
}
