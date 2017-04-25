RocketChat.Migrations.add({
	version: 93,
	up() {

		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			const setting = RocketChat.models.Settings.findOne({ _id: 'Accounts_AllowAnonymousAccess' });
			if (setting && setting.value === true) {
				RocketChat.models.Settings.update({ _id: 'Accounts_AllowAnonymousRead' }, { $set: { value: setting.value } });
			}
		}
	}
});
