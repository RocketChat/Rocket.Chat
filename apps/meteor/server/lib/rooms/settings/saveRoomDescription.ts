import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { UpdateResult } from 'mongodb';

export const saveRoomDescription = async function (rid: string, roomDescription: string, user: IUser): Promise<UpdateResult> {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomDescription',
		});
	}

	const update = await Rooms.setDescriptionById(rid, roomDescription);
	await Message.saveSystemMessage('room_changed_description', rid, roomDescription, user);
	return update;
};
