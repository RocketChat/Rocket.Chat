Meteor.methods({
	deleteUserOwnAccount: function(password) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('invalid-user', "[methods] deleteUserOwnAccount -> Invalid user");
		}

		const user = RocketChat.models.Users.findOneById(Meteor.userId());

		result = Accounts._checkPassword(user, { digest: password, algorithm: 'sha-256' });
		if (result.error) {
			throw new Meteor.Error('invalid-password', "[methods] deleteUserOwnAccount -> Invalid password");
		}

		RocketChat.models.Messages.removeByUserId(Meteor.userId()); // Remove user messages
		RocketChat.models.Subscriptions.findByUserId(Meteor.userId()).forEach((subscription) => {
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

		RocketChat.models.Subscriptions.removeByUserId(Meteor.userId()); // Remove user subscriptions
		RocketChat.models.Rooms.removeByTypeContainingUsername('d', user.username); // Remove direct rooms with the user
		RocketChat.models.Rooms.removeUsernameFromAll(user.username); // Remove user from all other rooms
		RocketChat.models.Users.removeById(Meteor.userId()); // Remove user from users database

		return true;
	}
})