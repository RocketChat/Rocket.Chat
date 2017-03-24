RocketChat.Migrations.add({
	version: 87,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users) {
			RocketChat.models.Users.update({ 'settings.preferences.newMessageNotification': false }, { $set: { 'settings.preferences.newMessageNotification': 'none' } }, { multi: true });
			RocketChat.models.Users.update({ 'settings.preferences.newMessageNotification': true }, { $unset: { 'settings.preferences.newMessageNotification': 1 } }, { multi: true });
			RocketChat.models.Users.update({ 'settings.preferences.newRoomNotification': false }, { $set: { 'settings.preferences.newRoomNotification': 'none' } }, { multi: true });
			RocketChat.models.Users.update({ 'settings.preferences.newRoomNotification': true }, { $unset: { 'settings.preferences.newRoomNotification': 1 } }, { multi: true });
		}
	}
});
