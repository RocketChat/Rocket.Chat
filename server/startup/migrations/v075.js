RocketChat.Migrations.add({
	version: 75,
	up: function() {
		RocketChat.models.Users.find({}, {username: 1, name: 1}).forEach((user) => {
			RocketChat.models.Messages.updateAllNamesByUserId(user._id, user.name);
			RocketChat.models.Subscriptions.setRealNameForDirectRoomsWithUsername(user.username, user.name);
		});
	}
});
