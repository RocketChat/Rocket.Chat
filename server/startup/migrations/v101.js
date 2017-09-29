RocketChat.Migrations.add({
	version: 101,
	up() {
		RocketChat.models.Subscriptions.update({lastActivity:{$exists:1}}, { $unset: { 'lastActivity': '' } }, {multi: true});
	}
});
