Meteor.methods({
	archiveRoom(rid) {

		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'archiveRoom' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'archive-room', room._id)) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'archiveRoom' });
		}

		return RocketChat.archiveRoom(rid);
	}
});
