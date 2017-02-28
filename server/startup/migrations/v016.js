RocketChat.Migrations.add({
	version: 16,
	up() {
		return RocketChat.models.Messages.tryDropIndex({
			_hidden: 1
		});
	}
});
