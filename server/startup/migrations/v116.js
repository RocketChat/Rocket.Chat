RocketChat.Migrations.add({
	version: 116,
	up() {
		if (RocketChat &&
		RocketChat.authz &&
		RocketChat.authz.getUsersInRole('admin').count() &&
		RocketChat.models &&
		RocketChat.models.Settings) {
			RocketChat.models.Settings.upsert(
				{ _id: 'Show_Setup_Wizard' },
				{ $set: { value: false }}
			);
		}
	}
});
