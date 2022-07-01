import { Statistics } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 218,
	async up() {
		try {
			await Statistics.col.dropIndex('createdAt_1');
		} catch (error: unknown) {
			console.warn('Error droping index for rocketchat_statistics, continuing...');
			console.warn(error);
		}
	},
});
