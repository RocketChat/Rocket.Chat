import type { RoomType, IRoom } from '@rocket.chat/core-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ChatRoom, ChatSubscription } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { LegacyRoomManager, readMessage } from '../../../../app/ui-utils/client';
import { omit } from '../../../../lib/utils/omit';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { call } from '../../../lib/utils/call';
import { callWithErrorHandling } from '../../../lib/utils/callWithErrorHandling';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';
import { waitUntilFind } from '../../../lib/utils/waitUntilFind';

const openRoom = (type: RoomType, name: string) => {
	return new Promise<{ type: RoomType; id: string } | { rid: IRoom['_id'] }>((resolve, reject) => {
		queueMicrotask(async () => {
			const user = await Meteor.userAsync();
			if ((user && !user.username) || (!user && !(settings.get<boolean>('Accounts_AllowAnonymousRead') ?? true))) {
				reject(new Error('Not authorized'));
				return;
			}

			try {
				const room = roomCoordinator.getRoomDirectives(type).findRoom(name) || (await call('getRoomByTypeAndName', type, name));
				if (!room._id) {
					reject(new Error('Room not found'));
					return;
				}

				ChatRoom.upsert({ _id: room._id }, { $set: room });

				if (room._id !== name && type === 'd') {
					// Redirect old url using username to rid
					await LegacyRoomManager.close(type + name);
					resolve({ type: 'd', id: room._id });
					return;
				}

				LegacyRoomManager.open({ typeName: type + name, rid: room._id });

				if (room._id === RoomManager.opened) {
					resolve({ rid: room._id });
					return;
				}

				fireGlobalEvent('room-opened', omit(room, 'usernames'));

				// update user's room subscription
				const sub = ChatSubscription.findOne({ rid: room._id });
				if (sub && sub.open === false) {
					await callWithErrorHandling('openRoom', room._id);
				}

				if (sub) {
					const { rid } = sub;
					setTimeout(() => readMessage.read(rid), 1000);
				}

				resolve({ rid: room._id });
			} catch (error) {
				if (type === 'd') {
					try {
						const { rid } = await call('createDirectMessage', ...name.split(', '));
						await waitUntilFind(() => ChatSubscription.findOne({ rid }));
						resolve({ type: 'd', id: rid });
						return;
					} catch (error) {
						reject(error);
					}
				}
			}
		});
	});
};

export function useOpenRoom({ type, reference }: { type: RoomType; reference: string }) {
	const directRoute = useRoute('direct');

	return useQuery(['rooms', { type, ref: reference }], () => openRoom(type, reference), {
		onSuccess: (data) => {
			if ('type' in data && 'id' in data && data.type === 'd') {
				directRoute.push({ rid: data.id }, (prev) => prev);
			}
		},
	});
}
