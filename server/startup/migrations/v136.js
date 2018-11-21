RocketChat.Migrations.add({
	version: 136,
	up() {
		const personalTokensEnabled = RocketChat.settings.get('API_Enable_Personal_Access_Tokens');
		const roles = RocketChat.models.Roles.find({ scope: 'Users' }).fetch().map((role) => role._id);

		if (personalTokensEnabled) {
			RocketChat.models.Permissions.upsert({ _id: 'create-personal-access-tokens' }, { $set: { roles } });
		}

		RocketChat.models.Settings.remove({
			_id: 'API_Enable_Personal_Access_Tokens',
		});
	},
});
