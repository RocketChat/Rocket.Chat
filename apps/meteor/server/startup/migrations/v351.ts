import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 351,
	name: 'Remove the Use_RC_SDK setting',
	async up() {
		await Settings.removeById('Use_RC_SDK');
	},
});
