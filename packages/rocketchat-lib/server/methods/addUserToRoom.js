Meteor.methods({
	addUserToRoom(data) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addUserToRoom' });
		}

		if (!Match.test(data && data.rid, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'addUserToRoom' });
		}

		if (!Match.test(data && data.username, String)) {
			throw new Meteor.Error('error-invalid-username', 'Invalid username', { method: 'addUserToRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(data.rid);

		if (room.usernames.indexOf(Meteor.user().username) === -1) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'addUserToRoom' });
		}

		const fromId = Meteor.userId();
		if (!RocketChat.authz.hasPermission(fromId, 'add-user-to-room', room._id)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'addUserToRoom' });
		}

		if (room.t === 'd') {
			throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', { method: 'addUserToRoom' });
		}


		const newUser = RocketChat.models.Users.findOneByUsername(data.username);
		RocketChat.addUserToRoom(data.rid, newUser, Meteor.user());

		return true;
	}
});
