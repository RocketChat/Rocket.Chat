import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 191,
	async up() {
		return Settings.deleteMany({ _id: /theme-color-status/ });
	},
});
