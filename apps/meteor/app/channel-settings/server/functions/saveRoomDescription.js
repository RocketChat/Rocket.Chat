import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Messages, Rooms } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

export const saveRoomDescription = async function (rid, roomDescription, user) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomDescription',
		});
	}

	const update = await Rooms.setDescriptionById(rid, roomDescription);
	await Messages.createWithTypeRoomIdMessageUserAndUnread(
		'room_changed_description',
		rid,
		roomDescription,
		user,
		settings.get('Message_Read_Receipt_Enabled'),
	);
	return update;
};
