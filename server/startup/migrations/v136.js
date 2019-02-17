import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings, Roles, Permissions } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';

Migrations.add({
	version: 136,
	up() {
		const personalTokensEnabled = settings.get('API_Enable_Personal_Access_Tokens');
		const roles = Roles.find({ scope: 'Users' }).fetch().map((role) => role._id);

		if (personalTokensEnabled) {
			Permissions.upsert({ _id: 'create-personal-access-tokens' }, { $set: { roles } });
		}

		Settings.remove({
			_id: 'API_Enable_Personal_Access_Tokens',
		});
	},
});
