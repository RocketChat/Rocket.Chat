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

                    RocketChat.models.Settings.deleteOne({_id: 'Accounts_Default_User_Preferences_viewMode'});
				}
			}

			if (RocketChat.models.Users) {
				RocketChat.models.Users.find({ 'settings.preferences.viewMode': { $exists: 1 } }).forEach(function(user) {
					RocketChat.models.Users.update(
						{ _id: user._id },
                        { $set: { 'settings.preferences.messageViewMode': user.settings.preferences.viewMode }},
                        { $unset: { 'settings.preferences.viewMode': 1 } }
					);
				});
			}
		}
	}
});