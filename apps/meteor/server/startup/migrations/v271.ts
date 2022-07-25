import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

// Removes deprecated Show Message In Main Thread preference
addMigration({
	version: 271,
	async up() {
		await Settings.removeById('Accounts_Default_User_Preferences_showMessageInMainThread');
	},
});
