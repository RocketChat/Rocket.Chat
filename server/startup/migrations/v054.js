RocketChat.Migrations.add({
	version: 54,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users) {
			// Set default message viewMode to 'normal' or 'cozy' depending on the users' current settings and remove the field 'compactView'
			RocketChat.models.Users.update({ 'settings.preferences.compactView': true }, { $set: { 'settings.preferences.viewMode': 1 }, $unset: { 'settings.preferences.compactView': 1 } }, { multi: true });
			RocketChat.models.Users.update({ 'settings.preferences.viewMode': { $ne: 1 } }, { $set: { 'settings.preferences.viewMode': 0 } }, { multi: true });
		}
	}
});
