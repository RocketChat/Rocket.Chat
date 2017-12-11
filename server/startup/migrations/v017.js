RocketChat.Migrations.add({
	version: 17,
	up() {
		return RocketChat.models.Messages.tryDropIndex({
			_hidden: 1
		});
	}
});
