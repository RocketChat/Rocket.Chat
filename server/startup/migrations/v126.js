RocketChat.Migrations.add({
	version: 126,
	up() {
		if (!RocketChat.models || !RocketChat.models.Settings) {
			return;
		}

		const query = {
			_id: 'Accounts_Default_User_Preferences_idleTimeoutLimit'
		};
		const setting = RocketChat.models.Settings.findOne(query);

		if (setting) {
			setting._id = 'Accounts_Default_User_Preferences_idleTimeLimit';
			RocketChat.models.Settings.insert(setting);
			RocketChat.models.Settings.remove(query);
		}
	}
});
