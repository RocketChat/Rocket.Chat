import { CronHistory } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Drop unique index on intendedAt and name from cron_history',
	async up() {
		try {
			await CronHistory.col.dropIndex('intendedAt_1_name_1');
		} catch (error: any) {
			if (error.codeName !== 'IndexNotFound') {
				throw error;
			}
		}
	},
});
