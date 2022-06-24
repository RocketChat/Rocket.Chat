import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 207,
	up() {
		return Settings.removeById('theme-color-tertiary-background-color');
	},
});
