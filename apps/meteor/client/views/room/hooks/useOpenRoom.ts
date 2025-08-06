import { isPublicRoom, type IRoom, type RoomType } from '@rocket.chat/core-typings';
import { getObjectKeys } from '@rocket.chat/tools';
import { useMethod, usePermission, useRoute, useSetting, useUser } from '@rocket.chat/ui-contexts';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useOpenRoomMutation } from './useOpenRoomMutation';
import { roomFields } from '../../../../lib/publishFields';
import { NotAuthorizedError } from '../../../lib/errors/NotAuthorizedError';
import { NotSubscribedToRoomError } from '../../../lib/errors/NotSubscribedToRoomError';
import { OldUrlRoomError } from '../../../lib/errors/OldUrlRoomError';
import { RoomNotFoundError } from '../../../lib/errors/RoomNotFoundError';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { Rooms } from '../../../stores';

export function useOpenRoom({ type, reference }: { type: RoomType; reference: string }) {
	const user = useUser();
	const hasPreviewPermission = usePermission('preview-c-room');
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', true);
	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const createDirectMessage = useMethod('createDirectMessage');
	const directRoute = useRoute('direct');
	const openRoom = useOpenRoomMutation();

	const result = useQuery({
		// we need to add uid and username here because `user` is not loaded all at once (see UserProvider -> Meteor.user())
		queryKey: ['rooms', { reference, type }, { uid: user?._id, username: user?.username }] as const,

		queryFn: async (): Promise<{ rid: IRoom['_id'] }> => {
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
				if (type !== 'd') {
					throw new RoomNotFoundError(undefined, { type, reference });
				}

				try {
					const { rid } = await createDirectMessage(...reference.split(', '));

					directRoute.push({ rid }, (prev) => prev);
				} catch (error) {
					throw new RoomNotFoundError(undefined, { type, reference });
				}

				throw new OldUrlRoomError(undefined, { type, reference });
			}

			if (!roomData._id) {
				throw new RoomNotFoundError(undefined, { type, reference });
			}

			const { Rooms, Subscriptions } = await import('../../../stores');

			const unsetKeys = getObjectKeys(roomData).filter((key) => !(key in roomFields));
			unsetKeys.forEach((key) => {
				delete roomData[key];
			});
			Rooms.state.store(roomData);

			const room = Rooms.state.get(roomData._id);

			if (!room) {
				throw new TypeError('room is undefined');
			}

			const { LegacyRoomManager } = await import('../../../../app/ui-utils/client');

			if (reference !== undefined && room._id !== reference && type === 'd') {
				// Redirect old url using username to rid
				LegacyRoomManager.close(type + reference);
				directRoute.push({ rid: room._id }, (prev) => prev);
				throw new OldUrlRoomError(undefined, { rid: room._id });
			}

			const { RoomManager } = await import('../../../lib/RoomManager');

			const sub = Subscriptions.state.find((record) => record.rid === room._id);

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
		retry: 0,
	});

	const queryClient = useQueryClient();
	const { error } = result;

	useEffect(() => {
		if (error) {
			if (['l', 'v'].includes(type) && error instanceof RoomNotFoundError) {
				Rooms.state.remove((record) => Object.values(record).includes(reference));
				queryClient.removeQueries({ queryKey: ['rooms', reference] });
				queryClient.removeQueries({ queryKey: roomsQueryKeys.info(reference) });
			}
		}
	}, [error, queryClient, reference, type]);

	return result;
}
