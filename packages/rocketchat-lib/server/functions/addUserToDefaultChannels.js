RocketChat.addUserToDefaultChannels = function(user, silenced) {
	RocketChat.callbacks.run('beforeJoinDefaultChannels', user);
	let defaultRooms = RocketChat.models.Rooms.findByDefaultAndTypes(true, ['c', 'p'], {fields: {usernames: 0}}).fetch();
	defaultRooms.forEach((room) => {

		// put user in default rooms
		RocketChat.models.Rooms.addUsernameById(room._id, user.username);

		if (!RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)) {

			// Add a subscription to this user
			RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
				ts: new Date(),
				open: true,
				alert: true,
				unread: 1
			});

			// Insert user joined message
			if (!silenced) {
				RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, user);
			}
		}
	});
};
