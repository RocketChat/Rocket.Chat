RocketChat.removeUserFromRoom = function(rid, user) {
	const room = RocketChat.models.Rooms.findOneById(rid);

	if (room) {
		RocketChat.callbacks.run('beforeLeaveRoom', user, room);
		RocketChat.models.Rooms.removeUsernameById(rid, user.username);

		if (room.usernames.indexOf(user.username) !== -1) {
			const removedUser = user;
			RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rid, removedUser);
		}

		if (room.t === 'l') {
			RocketChat.models.Messages.createCommandWithRoomIdAndUser('survey', rid, user);
		}

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId(rid, user._id);

		Meteor.defer(function() {
			RocketChat.callbacks.run('afterLeaveRoom', user, room);
		});
	}
};
