RocketChat.Migrations.add({
	version: 24,
	up() {
		return RocketChat.models.Permissions.remove({
			_id: 'access-rocket-permissions'
		});
	}
});
