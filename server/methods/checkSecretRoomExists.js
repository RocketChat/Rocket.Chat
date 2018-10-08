import s from 'underscore.string';

/**
 * Check if there are any non-listable secret rooms exists
 */
Meteor.methods({
	checkSecretRoomExists(text = '', type = 'p') {
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');
		const count = RocketChat.models.Rooms.findByNameAndType(regex, type).count();
		const listableRooms = RocketChat.models.Rooms.findListableByNameAndType(regex, type).count();
		return count > listableRooms;
	},
});
