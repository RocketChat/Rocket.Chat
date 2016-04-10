RocketChat.Migrations.add({
	version: 41,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users) {
			RocketChat.models.Users.update({ bot: true }, { $set: { type: 'bot' } }, { multi: true });
			RocketChat.models.Users.update({ 'profile.guest': true }, { $set: { type: 'visitor' } }, { multi: true });
			RocketChat.models.Users.update({ type: { $exists: false } }, { $set: { type: 'user' } }, { multi: true });
		}
	}
});
