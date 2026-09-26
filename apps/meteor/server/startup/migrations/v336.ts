import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Replace tmid_1 index on rocketchat_message with tmid_1_ts_-1',
	async up() {
		await Messages.col.createIndex({ tmid: 1, ts: -1 }, { partialFilterExpression: { tmid: { $exists: true } } });

		try {
			await Messages.col.dropIndex('tmid_1');
		} catch (e: any) {
			if (e?.code !== 27 && e?.codeName !== 'IndexNotFound') {
				throw e;
			}
		}
	},
});
