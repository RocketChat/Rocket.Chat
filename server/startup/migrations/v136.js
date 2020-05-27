import { Migrations } from '../../migrations';
import { Settings, Roles, Permissions } from '../../../app/models';
import { settings } from '../../../app/settings';

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
