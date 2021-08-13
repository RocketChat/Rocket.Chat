import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms, Messages } from '../../app/models';

Meteor.methods({
	removeOldTags(tags) {
		check(tags, Array);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeTags',
			});
		}

		const user = Meteor.user();

		const cursor = Rooms.findRoomsWithSpecifiedTags(tags);
		const rooms = cursor.fetch();

		for (const room of rooms) {
			Rooms.unsetTagsById(room._id, tags);
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('server_tags_updated', room._id, room.tags.filter((tag) => !tags.includes(tag)), user);
		}
	},
});
