import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';

export const saveRoomTags = function(rid, roomTags, user, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTags',
		});
	}

	const update = Rooms.setTagsById(rid, roomTags);
	if (update && sendMessage) {
		if (roomTags.length) {
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_tags', rid, roomTags, user);
		} else {
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_removed_tags', rid, '', user);
		}
	}
	return update;
};
