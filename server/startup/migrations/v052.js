RocketChat.Migrations.add({
	version: 52,
	up() {
		RocketChat.models.Users.update({ _id: 'rocket.cat' }, { $addToSet: { roles: 'bot' } });
	}
});
