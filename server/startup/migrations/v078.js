RocketChat.Migrations.add({
	version: 78,
	up: function() {
		RocketChat.models.Permissions.update({ _id: { $in: ['create-c', 'create-d', 'create-p'] }}, { $addToSet: { roles: 'bot' }}, { multi: true });
	}
});
