import { Message } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { UpdateResult, Document } from 'mongodb';

import { RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';
import { i18n } from '../../../../server/lib/i18n';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { notifyOnSubscriptionChangedByRoomId } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';

export const saveRoomType = async function (
	rid: string,
	roomType: IRoom['t'],
	user: IUser,
	sendMessage = true,
): Promise<UpdateResult | Document> {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomType',
		});
	}
	if (roomType !== 'c' && roomType !== 'p') {
		throw new Meteor.Error('error-invalid-room-type', 'error-invalid-room-type', {
			function: 'RocketChat.saveRoomType',
			type: roomType,
		});
	}
	const room = await Rooms.findOneById(rid);
	if (room == null) {
		throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
			function: 'RocketChat.saveRoomType',
			_id: rid,
		});
	}

	if (!(await roomCoordinator.getRoomDirectives(room.t)?.allowRoomSettingChange(room, RoomSettingsEnum.TYPE))) {
		throw new Meteor.Error('error-direct-room', "Can't change type of direct rooms", {
			function: 'RocketChat.saveRoomType',
		});
	}

	const result = await Promise.all([Rooms.setTypeById(rid, roomType), Subscriptions.updateTypeByRoomId(rid, roomType)]);

	if (!result) {
		return result;
	}

	if (result[1]?.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	if (sendMessage) {
		let message;
		if (roomType === 'c') {
			message = i18n.t('public', {
				lng: user?.language || settings.get('Language') || 'en',
			});
		} else {
			message = i18n.t('private', {
				lng: user?.language || settings.get('Language') || 'en',
			});
		}
		await Message.saveSystemMessage('room_changed_privacy', rid, message, user);
	}

	return result;
};
