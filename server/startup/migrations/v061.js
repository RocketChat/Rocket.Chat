RocketChat.Migrations.add({
	version: 61,
	up: function() {
		RocketChat.models.Users.find({ active: false }).forEach(function(user) {
			RocketChat.models.Subscriptions.setArchivedByUsername(user.username, true);
		});
	}
});
