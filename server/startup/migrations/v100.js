RocketChat.Migrations.add({
	version: 100,
	up() {
		RocketChat.models.Subscriptions.update({audioNotification:{$exists:1}}, { $rename: { 'audioNotification': 'audioNotifications' } });
	}
});
