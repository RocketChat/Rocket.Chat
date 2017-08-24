RocketChat.Migrations.add({
	version: 100,
	up() {
		RocketChat.models.Subscriptions.update({$exists:{audioNotification:1}}, { $rename: { 'audioNotification': 'audioNotifications' } });
	}
});
