import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 292,
	name: 'Remove deprecated app framework settings',
	async up() {
		await Settings.removeById('Apps_Framework_Development_Mode');
		await Settings.removeById('Apps_Framework_enabled');
	},
});
