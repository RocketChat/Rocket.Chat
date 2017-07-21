Meteor.methods({
	addAllUserToRoom(rid, activeUsersOnly = false) {

		check (rid, String);
		check (activeUsersOnly, Boolean);

		if (RocketChat.authz.hasRole(this.userId, 'admin') === true) {
			const userCount = RocketChat.models.Users.find().count();
			if (userCount > RocketChat.settings.get('API_User_Limit')) {
				throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
					method: 'addAllToRoom'
				});
			}

			const room = RocketChat.models.Rooms.findOneById(rid);
			if (room == null) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', {
					method: 'addAllToRoom'
				});
			}

			const userFilter = {};
			if (activeUsersOnly === true) {
				userFilter.active = true;
			}

			const users = RocketChat.models.Users.find(userFilter).fetch();
			const now = new Date();
			users.forEach(function(user) {
				const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
				if (subscription != null) {
					return;
				}
				RocketChat.callbacks.run('beforeJoinRoom', user, room);
				RocketChat.models.Rooms.addUsernameById(rid, user.username);
				RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
					ts: now,
					open: true,
					alert: true,
					unread: 1,
					userMentions: 1,
					groupMentions: 0
				});
				RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rid, user, {
					ts: now
				});
				Meteor.defer(function() {});
				return RocketChat.callbacks.run('afterJoinRoom', user, room);
			});
			return true;
		} else {
			throw (new Meteor.Error(403, 'Access to Method Forbidden', {
				method: 'addAllToRoom'
			}));
		}
	}
});
