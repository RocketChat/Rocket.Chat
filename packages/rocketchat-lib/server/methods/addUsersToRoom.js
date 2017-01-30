Meteor.methods({
	addUsersToRoom: function(data) {
		var fromId, room;
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addUserToRoom'
			});
		}
		if (!Match.test(data != null ? data.rid : void 0, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'addUserToRoom'
			});
		}

		room = RocketChat.models.Rooms.findOneById(data.rid);
		if (room.usernames.indexOf(Meteor.user().username) === -1) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addUserToRoom'
			});
		}

		fromId = Meteor.userId();
		if (!RocketChat.authz.hasPermission(fromId, 'add-user-to-room', room._id)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addUserToRoom'
			});
		}
		if (room.t === 'd') {
			throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', {
				method: 'addUserToRoom'
			});
		}
		data.users = Array.isArray(data.users) ? data.users : [];
		data.users.forEach(function(username) {
			let newUser = RocketChat.models.Users.findOneByUsername(username);
			RocketChat.addUserToRoom(data.rid, newUser, Meteor.user());
		});
		return true;
	}
});