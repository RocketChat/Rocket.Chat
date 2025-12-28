import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 318,
	name: 'Remove "E2E Encryption" setting group',
	async up() {
		await Settings.deleteOne({ _id: 'E2E Encryption', type: 'group' });
	},
});
