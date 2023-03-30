import { Settings, Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 276,
	async up() {
		await Users.updateMany(
			{ 'settings.preferences.enableNewMessageTemplate': { $exists: 1 } },
			{
				$unset: { 'settings.preferences.enableNewMessageTemplate': 1 },
			},
		);
		await Settings.removeById('Accounts_Default_User_Preferences_enableNewMessageTemplate');
	},
});
