Meteor.methods({
	getRoomsByType(type) {
		check(type, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomsByType' });
		}

		return RocketChat.models.Rooms.findByTypeContainingUsername(type, Meteor.user().username).fetch();
	}
});
