import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { useMethod, useRoute, useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ChatRoom, ChatSubscription } from '../../../../app/models/client';
import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { roomFields } from '../../../../lib/publishFields';
import { omit } from '../../../../lib/utils/omit';
import { RoomManager } from '../../../lib/RoomManager';
import { NotAuthorizedError } from '../../../lib/errors/NotAuthorizedError';
import { RoomNotFoundError } from '../../../lib/errors/RoomNotFoundError';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';
import { waitUntilFind } from '../../../lib/utils/waitUntilFind';

export function useOpenRoom({ type, reference }: { type: RoomType; reference: string }) {
	const user = useUser();
	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead') ?? true;
	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const createDirectMessage = useMethod('createDirectMessage');
	const openRoom = useMethod('openRoom');
	const directRoute = useRoute('direct');

	return useQuery(
		// we need to add uid and username here because `user` is not loaded all at once (see UserProvider -> Meteor.user())
		['rooms', { type, reference }, { uid: user?._id, username: user?.username }] as const,
		async (): Promise<{ rid: IRoom['_id'] }> => {
			if ((user && !user.username) || (!user && !allowAnonymousRead)) {
				throw new NotAuthorizedError();
			}

			const roomData = await getRoomByTypeAndName(type, reference);

			if (!roomData._id) {
				throw new RoomNotFoundError(undefined, { type, reference });
			}

			const $set: Record<string, unknown> = {};
			const $unset: Record<string, unknown> = {};

			for (const key of Object.keys(roomFields)) {
				if (key in roomData) {
					$set[key] = roomData[key as keyof typeof roomData];
				} else {
					$unset[key] = '';
				}
			}

			ChatRoom.upsert({ _id: roomData._id }, { $set, $unset });
			const room = ChatRoom.findOne({ _id: roomData._id });

			if (!room) {
				throw new TypeError('room is undefined');
			}

			if (room._id !== reference && type === 'd') {
				// Redirect old url using username to rid
				await LegacyRoomManager.close(type + reference);
				throw new RoomNotFoundError(undefined, { rid: room._id });
			}

			LegacyRoomManager.open({ typeName: type + reference, rid: room._id });

			if (room._id === RoomManager.opened) {
				return { rid: room._id };
			}

			fireGlobalEvent('room-opened', omit(room, 'usernames'));

			// update user's room subscription
			const sub = ChatSubscription.findOne({ rid: room._id });
			if (sub && !sub.open) {
				await openRoom(room._id);
			}
			return { rid: room._id };
		},
		{
			onError: async (error) => {
				if (type !== 'd') {
					return;
				}

				if (error instanceof RoomNotFoundError && error.details !== undefined && 'rid' in error.details) {
					directRoute.push({ rid: error.details.rid }, (prev) => prev);
					return;
				}

				const { rid } = await createDirectMessage(...reference.split(', '));
				await waitUntilFind(() => ChatSubscription.findOne({ rid }));
				directRoute.push({ rid }, (prev) => prev);
			},
		},
	);
}
