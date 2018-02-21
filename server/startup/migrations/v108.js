RocketChat.Migrations.add({
	version: 108,
	up() {
		if (RocketChat && RocketChat.models) {

			if (RocketChat.models.Settings) {
				const setting = RocketChat.models.Settings.findOne({ _id: 'Accounts_Default_User_Preferences_idleTimeoutLimit' });
				if (setting && setting.value) {
					RocketChat.models.Settings.update(
						{ _id: 'Accounts_Default_User_Preferences_idleTimeoutLimit' },
						{ $set: { value: setting.value / 1000 } }
					);
				}
			}

			if (RocketChat.models.Users) {
				RocketChat.models.Users.find({ 'settings.preferences.idleTimeLimit': { $exists: 1 } }).forEach(function(user) {
					RocketChat.models.Users.update(
						{ _id: user._id },
						{ $set: { 'settings.preferences.idleTimeLimit': user.settings.preferences.idleTimeLimit / 1000 } }
					);
				});
			}
		}
	}
});