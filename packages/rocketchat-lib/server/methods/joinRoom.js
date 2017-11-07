Meteor.methods({
	joinRoom(rid, code) {

		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		if ((room.t !== 'c') || (RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}

		if ((room.joinCodeRequired === true) && (code !== room.joinCode) && !RocketChat.authz.hasPermission(Meteor.userId(), 'join-without-join-code')) {
			throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', { method: 'joinRoom' });
		}

		return RocketChat.addUserToRoom(rid, Meteor.user());
	}
});
