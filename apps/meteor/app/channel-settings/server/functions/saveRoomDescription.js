import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms } from '@rocket.chat/models';

import { Messages } from '../../../models/server';

export const saveRoomDescription = async function (rid, roomDescription, user) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomDescription',
		});
	}

	const update = await Rooms.setDescriptionById(rid, roomDescription);
	Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', rid, roomDescription, user);
	return update;
};
