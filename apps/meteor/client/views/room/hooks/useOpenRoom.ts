import type { RoomType, IRoom } from '@rocket.chat/core-typings';
import { useMethod, useRoute, useSetting, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ChatRoom, ChatSubscription } from '../../../../app/models/client';
import { LegacyRoomManager, readMessage } from '../../../../app/ui-utils/client';
import { omit } from '../../../../lib/utils/omit';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';
import { waitUntilFind } from '../../../lib/utils/waitUntilFind';

export function useOpenRoom({ type, reference }: { type: RoomType; reference: string }) {
	const user = useUser();
	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead') ?? true;
	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const createDirectMessage = useMethod('createDirectMessage');
	const openRoom = useMethod('openRoom');
	const directRoute = useRoute('direct');
	const dispatchToastMessage = useToastMessageDispatch();

	return useQuery(
		['rooms', { type, reference }] as const,
		() =>
			new Promise<{ type: RoomType; id: string } | { rid: IRoom['_id'] }>((resolve, reject) => {
				queueMicrotask(async () => {
					if ((user && !user.username) || (!user && !allowAnonymousRead)) {
						reject(new Error('Not authorized'));
						return;
					}

					try {
						const room = roomCoordinator.getRoomDirectives(type).findRoom(reference) || (await getRoomByTypeAndName(type, reference));
						if (!room._id) {
							reject(new Error('Room not found'));
							return;
						}

						ChatRoom.upsert({ _id: room._id }, { $set: room });

						if (room._id !== reference && type === 'd') {
							// Redirect old url using username to rid
							await LegacyRoomManager.close(type + reference);
							resolve({ type: 'd', id: room._id });
							return;
						}

						LegacyRoomManager.open({ typeName: type + reference, rid: room._id });

						if (room._id === RoomManager.opened) {
							resolve({ rid: room._id });
							return;
						}

						fireGlobalEvent('room-opened', omit(room, 'usernames'));

						// update user's room subscription
						const sub = ChatSubscription.findOne({ rid: room._id });
						if (sub && sub.open === false) {
							try {
								await openRoom(room._id);
							} catch (error) {
								dispatchToastMessage({ type: 'error', message: error });
								reject(error);
								return;
							}
						}

						if (sub) {
							const { rid } = sub;
							setTimeout(() => readMessage.read(rid), 1000);
						}

						resolve({ rid: room._id });
					} catch (error) {
						if (type === 'd') {
							try {
								const { rid } = await createDirectMessage(...reference.split(', '));
								await waitUntilFind(() => ChatSubscription.findOne({ rid }));
								resolve({ type: 'd', id: rid });
								return;
							} catch (error) {
								reject(error);
							}
						}
					}
				});
			}),
		{
			onSuccess: (data) => {
				if ('type' in data && 'id' in data && data.type === 'd') {
					directRoute.push({ rid: data.id }, (prev) => prev);
				}
			},
		},
	);
}
