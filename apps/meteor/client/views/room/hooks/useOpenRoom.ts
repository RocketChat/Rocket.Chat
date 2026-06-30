import { isPublicRoom, type IRoom, type RoomType } from '@rocket.chat/core-typings';
import { getObjectKeys } from '@rocket.chat/tools';
import { useEndpoint, useMethod, usePermission, useRoute, useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useOpenRoomMutation } from './useOpenRoomMutation';
import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { roomFields } from '../../../../lib/publishFields';
import { RoomManager } from '../../../lib/RoomManager';
import { NotAuthorizedError } from '../../../lib/errors/NotAuthorizedError';
import { NotSubscribedToRoomError } from '../../../lib/errors/NotSubscribedToRoomError';
import { OldUrlRoomError } from '../../../lib/errors/OldUrlRoomError';
import { RoomNotFoundError } from '../../../lib/errors/RoomNotFoundError';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { Rooms, Subscriptions } from '../../../stores';

export function useOpenRoom({ type, reference }: { type: RoomType; reference: string }) {
	const user = useUser();
	const hasPreviewPermission = usePermission('preview-c-room');
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', true);
	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const createDirectMessage = useEndpoint('POST', '/v1/im.create');
	const directRoute = useRoute('direct');
	const openRoom = useOpenRoomMutation();

	// Try to resolve the reference to a known rid using locally cached subscriptions and rooms.
	// Returns null when the cache can't safely answer (anonymous user, public preview, DM redirect
	// from a username URL, missing record). The caller still validates side effects.
	const tryCacheShortcut = useCallback((): { rid: IRoom['_id'] } | undefined => {
		if (!user?._id || !reference || !type) {
			return undefined;
		}
		const sub = Subscriptions.state.find((record) => record.t === type && (record.rid === reference || record.name === reference));
		if (!sub) {
			return undefined;
		}
		const room = Rooms.state.get(sub.rid);
		if (!room) {
			return undefined;
		}
		// DM URLs that still reference a username (rather than the rid) need the redirect path in
		// queryFn — let the server resolve.
		if (type === 'd' && reference !== sub.rid) {
			return undefined;
		}
		// Skip when the user hasn't actually opened the subscription yet; queryFn will call
		// openRoom.mutateAsync to flip sub.open.
		if (sub.open === false) {
			return undefined;
		}
		return { rid: sub.rid };
	}, [reference, type, user?._id]);

	const result = useQuery({
		// we need to add uid and username here because `user` is not loaded all at once (see UserProvider -> Meteor.user())
		queryKey: roomsQueryKeys.roomReference(reference, type, user?._id, user?.username),

		// Render immediately from local cache when we already know the rid; queryFn still runs in
		// the background to revalidate permissions / fetch fresh room fields.
		placeholderData: tryCacheShortcut,

		queryFn: async (): Promise<{ rid: IRoom['_id'] }> => {
			const cached = tryCacheShortcut();
			if (cached) {
				LegacyRoomManager.open({ typeName: type + reference, rid: cached.rid });
				return cached;
			}
			if ((user && !user.username) || (!user && !allowAnonymousRead)) {
				throw new NotAuthorizedError();
			}

			if (!reference || !type) {
				throw new RoomNotFoundError(undefined, { type, reference });
			}

			let roomData: IRoom;
			try {
				roomData = await getRoomByTypeAndName(type, reference);
			} catch (error) {
				const isDefinitivelyNotFound = error && typeof error === 'object' && 'error' in error && error.error === 'error-invalid-room';

				if (!isDefinitivelyNotFound) {
					throw error;
				}

				if (type !== 'd') {
					throw new RoomNotFoundError(undefined, { type, reference });
				}

				try {
					const { room } = await createDirectMessage({ usernames: reference });

					directRoute.push({ rid: room._id }, (prev) => prev);
				} catch (error) {
					throw new RoomNotFoundError(undefined, { type, reference });
				}

				throw new OldUrlRoomError(undefined, { type, reference });
			}

			if (!roomData._id) {
				throw new RoomNotFoundError(undefined, { type, reference });
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

			const sub = Subscriptions.state.find((record) => record.t === type && (record.rid === reference || record.name === reference));

			if (reference !== undefined && room._id !== reference && type === 'd') {
				// Redirect old url using username to rid
				LegacyRoomManager.close(type + reference);
				directRoute.push({ rid: room._id }, (prev) => prev);
				throw new OldUrlRoomError(undefined, { rid: room._id });
			}

			// if user doesn't exist at this point, anonymous read is enabled, otherwise an error would have been thrown
			if (user && !sub && !hasPreviewPermission && isPublicRoom(room)) {
				throw new NotSubscribedToRoomError(undefined, { rid: room._id });
			}

			LegacyRoomManager.open({ typeName: type + reference, rid: room._id });

			if (room._id === RoomManager.opened) {
				return { rid: room._id };
			}

			// update user's room subscription

			if (!!user?._id && sub && !sub.open) {
				await openRoom.mutateAsync({ roomId: room._id, userId: user._id });
			}

			return { rid: room._id };
		},
		retry: (failureCount, error) => {
			const unrecoverableErrors = [RoomNotFoundError, OldUrlRoomError, NotAuthorizedError, NotSubscribedToRoomError];

			if (unrecoverableErrors.some((e) => error instanceof e)) {
				return false;
			}

			return failureCount < 4;
		},
		retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
	});

	const queryClient = useQueryClient();
	const { error } = result;

	useEffect(() => {
		if (error) {
			if (type === 'l' && error instanceof RoomNotFoundError) {
				Rooms.state.remove((record) => Object.values(record).includes(reference));
				queryClient.removeQueries({ queryKey: ['rooms', reference] });
				queryClient.removeQueries({ queryKey: roomsQueryKeys.info(reference) });
			}
		}
	}, [error, queryClient, reference, type]);

	return result;
}
