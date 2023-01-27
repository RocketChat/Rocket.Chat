import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { Users } from '../../../app/models/server';

addMigration({
	version: 283,
	up() {
		Users.update(
			{ 'settings.preferences.messageViewMode': { $exists: 1 } },
			{
				$unset: {
					'settings.preferences.messageViewMode': 1,
				},
			},
			{ multi: true },
		);

		return Settings.removeById('Accounts_Default_User_Preferences_messageViewMode');
	},
});
