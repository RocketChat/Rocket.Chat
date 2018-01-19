RocketChat.deleteUser = function(userId) {
	const user = RocketChat.models.Users.findOneById(userId);

	RocketChat.models.Messages.removeByUserId(userId); // Remove user messages
	RocketChat.models.Subscriptions.db.findByUserId(userId).forEach((subscription) => {
		const room = RocketChat.models.Rooms.findOneById(subscription.rid);
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

	// removes user's avatar
	if (user.avatarOrigin === 'upload' || user.avatarOrigin === 'url') {
		FileUpload.getStore('Avatars').deleteByName(user.username);
	}

	RocketChat.models.Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.

	RocketChat.models.Users.removeById(userId); // Remove user from users database
};
