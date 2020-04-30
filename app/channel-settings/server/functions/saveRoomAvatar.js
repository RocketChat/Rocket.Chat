import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';
import { setRoomAvatar } from '../../../lib/server/functions/setRoomAvatar';

export const saveRoomAvatar = function(rid, avatar, user, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomAvatar',
		});
	}

	const room = Rooms.findOneById(rid);
	const { blob, contentType, service } = avatar;

	setRoomAvatar(room, blob, contentType, service);

	if (sendMessage) {
		Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_avatar', rid, '', user);
	}
};
