RocketChat.Migrations.add({
	version: 28,
	up() {
		return RocketChat.models.Permissions.addRole('view-c-room', 'bot');
	}
});
