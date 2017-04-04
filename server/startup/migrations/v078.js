RocketChat.Migrations.add({
	version: 78,
	up() {
		RocketChat.models.Permissions.update({ _id: { $in: ['create-c', 'create-d', 'create-p'] }}, { $addToSet: { roles: 'bot' }}, { multi: true });
	}
});
