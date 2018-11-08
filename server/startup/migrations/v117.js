RocketChat.Migrations.add({
	version: 117,
	up() {
		if (RocketChat.authz &&
		RocketChat.models &&
		RocketChat.models.Settings &&
		RocketChat.authz.getUsersInRole('admin').count()) {
			RocketChat.models.Settings.upsert(
				{
					_id: 'Show_Setup_Wizard',
				}, {
					$set: { value: 'completed' },
				}
			);
		}
	},
});
