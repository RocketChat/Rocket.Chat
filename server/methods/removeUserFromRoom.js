Meteor.methods({
	removeUserFromRoom(data) {
		check(data, Match.ObjectIncluding({
			rid: String,
			username: String
		}));

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeUserFromRoom'
			});
		}

		if (!RocketChat.authz.hasPermission(fromId, 'remove-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeUserFromRoom'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(data.rid);

		if (!room || room.t === 'd') {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeUserFromRoom'
			});
		}

		if (Array.isArray(room.usernames) === false || room.usernames.includes(data.username) === false) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'removeUserFromRoom'
			});
		}

		const removedUser = RocketChat.models.Users.findOneByUsername(data.username);

		if (RocketChat.authz.hasRole(removedUser._id, 'owner', room._id)) {
			const numOwners = RocketChat.authz.getUsersInRole('owner', room._id).fetch().length;

			if (numOwners === 1) {
				throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
					method: 'removeUserFromRoom'
				});
			}
		}

		RocketChat.models.Rooms.removeUsernameById(data.rid, data.username);

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId(data.rid, removedUser._id);

		if (['c', 'p'].includes(room.t) === true) {
			RocketChat.authz.removeUserFromRoles(removedUser._id, ['moderator', 'owner'], data.rid);
		}

		const fromUser = RocketChat.models.Users.findOneById(fromId);

		RocketChat.models.Messages.createUserRemovedWithRoomIdAndUser(data.rid, removedUser, {
			u: {
				_id: fromUser._id,
				username: fromUser.username
			}
		});

		return true;
	}
});
