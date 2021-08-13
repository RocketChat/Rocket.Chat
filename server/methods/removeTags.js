import { Meteor } from 'meteor/meteor';

import { Rooms, Messages } from '../../app/models';

Meteor.methods({
	removeTags() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeTags',
			});
		}

		const user = Meteor.user();

		const cursor = Rooms.findRoomsWithTags();
		const rooms = cursor.fetch();

		for (const room of rooms) {
			Rooms.unsetAllTagsById(room._id);
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('server_discovery_disabled', room._id, '', user);
		}
	},
});
