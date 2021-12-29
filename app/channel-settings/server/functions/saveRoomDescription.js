import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';

export const saveRoomDescription = function (rid, roomDescription, user) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomDescription',
		});
	}

	const update = Rooms.setDescriptionById(rid, roomDescription);
	Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', rid, roomDescription, user);
	return update;
};
