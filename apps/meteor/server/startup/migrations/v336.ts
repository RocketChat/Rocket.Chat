import { ReadReceipts } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Drop "roomId_1_userId_1_messageId_1" index from Read Receipts collection',
	async up() {
		try {
			await ReadReceipts.col.dropIndex('roomId_1_userId_1_messageId_1');
		} catch (e: any) {
			if (e?.codeName !== 'IndexNotFound') {
				throw e;
			}
		}
	},
});
