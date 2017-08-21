Meteor.methods({
	canAccessRoom(rid, userId) {
		check(rid, String);
		check(userId, Match.Maybe(String));

		let user;

		if (!userId && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'canAccessRoom'
			});
		}

		if (userId) {
			user = RocketChat.models.Users.findOneById(userId, {
				fields: {
					username: 1
				}
			});

			if (!user || !user.username) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'canAccessRoom'
				});
			}
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoom'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);
		if (room) {
			if (RocketChat.authz.canAccessRoom.call(this, room, user)) {
				if (user) {
					room.username = user.username;
				}
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
