import { Meteor } from 'meteor/meteor';
import type { IRoom, RoomType } from '@rocket.chat/core-typings';

import { waitUntilFind } from '../../../../client/lib/utils/waitUntilFind';
import { ChatSubscription, ChatRoom, Subscriptions } from '../../../models/client';
import { queueMicrotask } from '../../../../client/lib/utils/queueMicrotask';
import { settings } from '../../../settings/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { call } from '../../../../client/lib/utils/call';
import { LegacyRoomManager } from '..';
import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { omit } from '../../../../lib/utils/omit';
import { RoomManager } from '../../../../client/lib/RoomManager';
import { readMessage } from './readMessages';

export const openRoom = (type: RoomType, name: string) => {
	return new Promise<{ type: RoomType; id: string } | { rid: IRoom['_id'] }>((resolve, reject) => {
		queueMicrotask(async () => {
			const user = await Meteor.userAsync();
			if ((user && !user.username) || (!user && (settings.get<boolean>('Accounts_AllowAnonymousRead') ?? true))) {
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
						await waitUntilFind(() => Subscriptions.findOne({ rid }));
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
