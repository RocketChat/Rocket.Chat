import { Meteor } from 'meteor/meteor';
import type { IMessage, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions, Messages } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { ohLogger as logger } from './logger';

class OnHoldHelperClass {
	async placeRoomOnHold(room: IOmnichannelRoom, comment: string, onHoldBy: IUser) {
		logger.debug(`Attempting to place room ${room._id} on hold by user ${onHoldBy?._id}`);

		const { _id: roomId } = room;

		if (!room || !isOmnichannelRoom(room)) {
			throw new Error('error-invalid-room');
		}
		if (!room.open) {
			throw new Error('error-room-already-closed');
		}
		if (room.onHold) {
			throw new Error('error-room-is-already-onHold');
		}

		const onHoldByUser: IMessage['u'] = {
			_id: onHoldBy._id,
			username: onHoldBy.username || '',
			name: onHoldBy.name || '',
		};

		await Promise.all([
			LivechatRooms.setOnHoldByRoomId(roomId),
			Subscriptions.setOnHoldByRoomId(roomId),
			Messages.createOnHoldHistoryWithRoomIdMessageAndUser(roomId, onHoldByUser, comment, 'on-hold'),
		]);

		Meteor.defer(() => {
			callbacks.run('livechat:afterOnHold', room);
		});

		logger.debug(`Room ${room._id} set on hold successfully`);
	}

	async resumeRoomOnHold(_room: IOmnichannelRoom, _comment: string, _resumeBy: IUser) {
		throw new Error('Method not implemented.');
	}
}

export const OnHoldHelper = new OnHoldHelperClass();
