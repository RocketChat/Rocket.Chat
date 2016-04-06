Meteor.methods({
	deleteUserOwnAccount: function(password) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteUserOwnAccount' });
		}

		if (!RocketChat.settings.get('Accounts_AllowDeleteOwnAccount')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteUserOwnAccount' });
		}

		const userId = Meteor.userId();
		const user = RocketChat.models.Users.findOneById(userId);

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteUserOwnAccount' });
		}

		if (user.services && user.services.password && s.trim(user.services.password.bcrypt)) {
			const result = Accounts._checkPassword(user, { digest: password, algorithm: 'sha-256' });
			if (result.error) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', { method: 'deleteUserOwnAccount' });
			}
		} else if (user.username !== s.trim(password)) {
			throw new Meteor.Error('error-invalid-username', 'Invalid username', { method: 'deleteUserOwnAccount' });
		}

		Meteor.defer(function() {
			RocketChat.models.Messages.removeByUserId(userId); // Remove user messages
			RocketChat.models.Subscriptions.findByUserId(userId).forEach((subscription) => {
				let room = RocketChat.models.Rooms.findOneById(subscription.rid);
				if (room) {
					if (room.t !== 'c' && room.usernames.length === 1) {
						RocketChat.models.Rooms.removeById(subscription.rid); // Remove non-channel rooms with only 1 user (the one being deleted)
					}
					if (room.t === 'd') {
						RocketChat.models.Subscriptions.removeByRoomId(subscription.rid);
						RocketChat.models.Messages.removeByRoomId(subscription.rid);
					}
				}
			});

			RocketChat.models.Subscriptions.removeByUserId(userId); // Remove user subscriptions
			RocketChat.models.Rooms.removeByTypeContainingUsername('d', user.username); // Remove direct rooms with the user
			RocketChat.models.Rooms.removeUsernameFromAll(user.username); // Remove user from all other rooms
			RocketChat.models.Users.removeById(userId); // Remove user from users database
		});

		return true;
	}
});
