Meteor.methods({
	getRoomJoinCode(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getJoinCode' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-join-code')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'getJoinCode' });
		}

		const [ room ] = RocketChat.models.Rooms.findById(rid).fetch();

		return room && room.joinCode;
	}
});
