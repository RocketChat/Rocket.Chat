RocketChat.Migrations.add({
	version: 126,
	up() {
		if (!RocketChat.models || !RocketChat.models.Settings) {
			return;
		}

		const query = {
			_id: 'Accounts_Default_User_Preferences_idleTimeoutLimit',
		};
		const setting = RocketChat.models.Settings.findOne(query);

		if (setting) {
			delete setting._id;
			RocketChat.models.Settings.upsert({ _id: 'Accounts_Default_User_Preferences_idleTimeLimit' }, setting);
			RocketChat.models.Settings.remove(query);
		}
	},
});
