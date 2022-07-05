import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 240,
	up() {
		return Settings.removeById('Support_Cordova_App');
	},
});
