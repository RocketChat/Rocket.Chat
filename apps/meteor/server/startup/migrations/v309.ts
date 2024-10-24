import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 309,
	name: 'Remove unused UI_Click_Direct_Message setting',
	async up() {
		await Settings.removeById('UI_Click_Direct_Message');
	},
});
