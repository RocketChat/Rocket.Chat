import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 283,
	async up() {
		await Settings.removeById('Accounts_Default_User_Preferences_messageViewMode');
	},
});
