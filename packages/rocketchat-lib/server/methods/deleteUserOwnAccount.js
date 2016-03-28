Meteor.methods({
	deleteUserOwnAccount: function(password) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('invalid-user', '[methods] deleteUserOwnAccount -> Invalid user');
		}

		if (!RocketChat.settings.get('Accounts_AllowDeleteOwnAccount')) {
			throw new Meteor.Error('not-authorized', '[methods] deleteUserOwnAccount -> Not authorized');
		}

		const userId = Meteor.userId();
		const user = RocketChat.models.Users.findOneById(userId);

		const result = Accounts._checkPassword(user, { digest: password, algorithm: 'sha-256' });
		if (result.error) {
			throw new Meteor.Error('invalid-password', '[methods] deleteUserOwnAccount -> Invalid password');
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
