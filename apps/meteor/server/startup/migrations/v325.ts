import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 325,
	name: 'Remove ECDH setting',
	async up() {
		await Settings.deleteOne({ _id: 'ECDH_Enabled' });
	},
});
