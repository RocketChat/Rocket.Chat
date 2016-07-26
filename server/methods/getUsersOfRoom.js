Meteor.methods({
	getUsersOfRoom(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		return RocketChat.cache.Rooms.findByIndex('_id', roomId).fetch().usernames;
	}
});
