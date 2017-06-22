RocketChat.Migrations.add({
	version: 61,
	up() {
		RocketChat.models.Users.find({ active: false }).forEach(function(user) {
			RocketChat.models.Subscriptions.setArchivedByUsername(user.username, true);
		});
	}
});
