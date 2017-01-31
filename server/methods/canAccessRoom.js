Meteor.methods({
	canAccessRoom(rid, userId) {
		check(rid, String);
		check(userId, String);

		const user = RocketChat.models.Users.findOneById(userId, {
			fields: {
				username: 1
			}
		});

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'canAccessRoom'
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoom'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);
		if (room) {
			if (RocketChat.authz.canAccessRoom.call(this, room, user)) {
				room.username = user.username;
				return room;
			}

			return false;
		} else {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoom'
			});
		}
	}
});
