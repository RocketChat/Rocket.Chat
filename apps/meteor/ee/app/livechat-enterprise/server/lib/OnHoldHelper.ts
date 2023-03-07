import { Meteor } from 'meteor/meteor';
import type { IMessage, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions, Messages, LivechatInquiry } from '@rocket.chat/models';

import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
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

	async resumeRoomOnHold(room: IOmnichannelRoom, comment: string, resumeBy: IUser, clientAction = false) {
		logger.debug(`Attempting to resume room ${room._id} on hold by user ${resumeBy?._id}`);

		if (!room || !isOmnichannelRoom(room)) {
			throw new Error('error-invalid-room');
		}

		if (!room.onHold) {
			throw new Error('error-room-not-on-hold');
		}

		const { _id: roomId, servedBy } = room;

		if (!servedBy) {
			logger.error(`No serving agent found for room ${roomId}`);
			throw new Error('error-room-not-served');
		}

		const inquiry = await LivechatInquiry.findOneByRoomId(roomId, {});
		if (!inquiry) {
			logger.error(`No inquiry found for room ${roomId}`);
			throw new Error('error-invalid-inquiry');
		}

		const { _id: agentId, username } = servedBy;

		await RoutingManager.takeInquiry(
			inquiry,
			{
				agentId,
				username,
			},
			{
				clientAction,
			},
		);

		const resumeByUser: IMessage['u'] = {
			_id: resumeBy._id,
			username: resumeBy.username || '',
			name: resumeBy.name || '',
		};

		await Promise.all([
			LivechatRooms.unsetOnHoldByRoomId(roomId),
			Subscriptions.unsetOnHoldByRoomId(roomId),
			Messages.createOnHoldHistoryWithRoomIdMessageAndUser(roomId, resumeByUser, comment, 'resume-onHold'),
		]);

		const updatedRoom = await LivechatRooms.findOneById(roomId, {});
		if (updatedRoom) {
			Meteor.defer(() => {
				callbacks.run('livechat:afterOnHoldChatResumed', updatedRoom);
			});
		}

		logger.debug(`Room ${room._id} resumed successfully`);
	}
}

export const OnHoldHelper = new OnHoldHelperClass();
