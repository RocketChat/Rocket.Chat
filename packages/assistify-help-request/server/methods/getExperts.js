/* globals SystemLogger */

Meteor.methods({
	getExperts() {
		const expertRoomName = RocketChat.settings.get('Assistify_Expert_Channel');
		SystemLogger.debug('Expert Channel:', expertRoomName);

		const room = RocketChat.models.Rooms.findByTypeAndName('c', expertRoomName).fetch();

		if (!room) {
			throw new Meteor.Error('no-expert-room-defined');
		}		else {
			return room.usernames;
		}
	}
});
