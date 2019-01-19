RocketChat.Migrations.add({
	version: 110,
	up() {
		if (RocketChat && RocketChat.models) {

			if (RocketChat.models.Settings) {
				const setting = RocketChat.models.Settings.findOne({ _id: 'Accounts_Default_User_Preferences_viewMode' });
				if (setting && setting.value) {
					RocketChat.models.Settings.update(
						{ _id: 'Accounts_Default_User_Preferences_messageViewMode' },
						{ $set: { value: setting.value } }
					);

					RocketChat.models.Settings.remove(
						{ _id: 'Accounts_Default_User_Preferences_viewMode' }
					);
				}
			}

			if (RocketChat.models.Users) {
				RocketChat.models.Users.update(
					{ 'settings.preferences.viewMode': { $exists: 1 } },
					{ $rename: { 'settings.preferences.viewMode': 'user.settings.preferences.messageViewMode' } },
				);
			}
		}
	},
	down() {
		if (RocketChat && RocketChat.models) {

			if (RocketChat.models.Settings) {
				const setting = RocketChat.models.Settings.findOne({ _id: 'Accounts_Default_User_Preferences_messageViewMode' });
				if (setting && setting.value) {
					RocketChat.models.Settings.update(
						{ _id: 'Accounts_Default_User_Preferences_viewMode' },
						{ $set: { value: setting.value } }
					);

					RocketChat.models.Settings.remove(
						{ _id: 'Accounts_Default_User_Preferences_messageViewMode' }
					);
				}
			}

			if (RocketChat.models.Users) {
				RocketChat.models.Users.update(
					{ 'settings.preferences.messageViewMode': { $exists: 1 } },
					{ $rename: { 'settings.preferences.messageViewMode': 'user.settings.preferences.viewMode' } },
				);
			}
		}
	},
});
