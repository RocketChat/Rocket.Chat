import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server/raw';
import { Users } from '../../../app/models/server';

addMigration({
	version: 261,
	up() {
		Users.update(
			{ 'settings.preferences.enableLegacyMessages': { $exists: 1 } },
			{
				$unset: { 'settings.preferences.enableLegacyMessages': 1 },
			},
			{ multi: true },
		);
		return Settings.removeById('Accounts_Default_User_Preferences_enableLegacyMessages');
	},
});
