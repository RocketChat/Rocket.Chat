RocketChat.Migrations.add({
	version: 46,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users) {
			RocketChat.models.Users.update({ type: { $exists: false } }, { $set: { type: 'user' } }, { multi: true });
		}
	}
});
