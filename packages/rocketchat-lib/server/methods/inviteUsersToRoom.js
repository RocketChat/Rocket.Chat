Meteor.methods({
	inviteUsersToRoom(data = {}) {
		// Validate user and room
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'inviteUsersToRoom'
			});
		}

		if (!Match.test(data.rid, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'inviteUsersToRoom'
			});
		}

		// No users to be invited
		if (!Array.isArray(data.users)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'inviteUsersToRoom'
			});
		}

		// Invite users to room
		data.users.forEach((username) => {
			const newUser = RocketChat.models.Users.findOneByUsername(username);
			if (!newUser) {
				return false;
			}

			RocketChat.inviteUserToRoom(data.rid, newUser, data.inviter);
		});

		// Delete message with invite if exists
		if (data.mid) {
			Meteor.call('deleteMessage', { _id: data.mid }, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		}

		return true;
	}
});
