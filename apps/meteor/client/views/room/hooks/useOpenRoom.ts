import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { useMethod, useRoute, useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

import { roomFields } from '../../../../lib/publishFields';
import { omit } from '../../../../lib/utils/omit';
import { NotAuthorizedError } from '../../../lib/errors/NotAuthorizedError';
import { OldUrlRoomError } from '../../../lib/errors/OldUrlRoomError';
import { RoomNotFoundError } from '../../../lib/errors/RoomNotFoundError';
import { queryClient } from '../../../lib/queryClient';

export function useOpenRoom({ type, reference }: { type: RoomType; reference: string }) {
	const user = useUser();
	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead') ?? true;
	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const createDirectMessage = useMethod('createDirectMessage');
	const openRoom = useMethod('openRoom');
	const directRoute = useRoute('direct');

	const unsubscribeFromRoomOpenedEvent = useRef<() => void>(() => undefined);

	return useQuery(
		// we need to add uid and username here because `user` is not loaded all at once (see UserProvider -> Meteor.user())
		['rooms', { type, reference }, { uid: user?._id, username: user?.username }] as const,
		async (): Promise<{ rid: IRoom['_id'] }> => {
			if ((user && !user.username) || (!user && !allowAnonymousRead)) {
				throw new NotAuthorizedError();
			}

			let roomData;
			try {
				roomData = await getRoomByTypeAndName(type, reference);
			} catch (error) {
				if (type !== 'd') {
					throw new RoomNotFoundError(undefined, { type, reference });
				}

				try {
					const { rid } = await createDirectMessage(...reference.split(', '));
					const { ChatSubscription } = await import('../../../../app/models/client');
					const { waitUntilFind } = await import('../../../lib/utils/waitUntilFind');
					await waitUntilFind(() => ChatSubscription.findOne({ rid }));
					directRoute.push({ rid }, (prev) => prev);
				} catch (error) {
					throw new RoomNotFoundError(undefined, { type, reference });
				}

				throw new OldUrlRoomError(undefined, { type, reference });
			}

			if (!roomData._id) {
				throw new RoomNotFoundError(undefined, { type, reference });
			}

			const $set: any = {};
			const $unset: any = {};

			for (const key of Object.keys(roomFields)) {
				if (key in roomData) {
					$set[key] = roomData[key as keyof typeof roomData];
				} else {
					$unset[key] = '';
				}
			}

			const { ChatRoom, ChatSubscription } = await import('../../../../app/models/client');

			ChatRoom.upsert({ _id: roomData._id }, { $set, $unset });
			const room = ChatRoom.findOne({ _id: roomData._id });

			if (!room) {
				throw new TypeError('room is undefined');
			}

			const { LegacyRoomManager } = await import('../../../../app/ui-utils/client');

			if (room._id !== reference && type === 'd') {
				// Redirect old url using username to rid
				await LegacyRoomManager.close(type + reference);
				directRoute.push({ rid: room._id }, (prev) => prev);
				throw new OldUrlRoomError(undefined, { rid: room._id });
			}

			const { RoomManager } = await import('../../../lib/RoomManager');
			const { fireGlobalEvent } = await import('../../../lib/utils/fireGlobalEvent');

			unsubscribeFromRoomOpenedEvent.current();
			unsubscribeFromRoomOpenedEvent.current = RoomManager.once('opened', () => fireGlobalEvent('room-opened', omit(room, 'usernames')));

			LegacyRoomManager.open({ typeName: type + reference, rid: room._id });

			if (room._id === RoomManager.opened) {
				return { rid: room._id };
			}

			// update user's room subscription
			const sub = ChatSubscription.findOne({ rid: room._id });
			if (sub && !sub.open) {
				await openRoom(room._id);
			}
			return { rid: room._id };
		},
		{
			retry: 0,
			onError: async (error) => {
				if (['l', 'v'].includes(type) && error instanceof RoomNotFoundError) {
					const { ChatRoom } = await import('../../../../app/models/client');

					ChatRoom.remove(reference);
					queryClient.removeQueries(['rooms', reference]);
					queryClient.removeQueries(['/v1/rooms.info', reference]);
				}
			},
		},
	);
}
