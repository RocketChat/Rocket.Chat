RocketChat.Migrations.add({
	version: 48,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users && RocketChat.models.Users.update) {
			RocketChat.models.Users.update({ avatarOrigin: { $exists: false } }, { $set: { avatarOrigin: 'initials' } }, { multi: true });
		}
	}
});
