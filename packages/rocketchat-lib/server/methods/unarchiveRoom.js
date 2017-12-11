Meteor.methods({
	unarchiveRoom(rid) {

		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unarchiveRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'unarchiveRoom' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'unarchive-room', room._id)) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'unarchiveRoom' });
		}

		return RocketChat.unarchiveRoom(rid);
	}
});
