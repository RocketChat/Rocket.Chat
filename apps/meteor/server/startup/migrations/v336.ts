import { ReadReceipts } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Drop "roomId_1_userId_1_messageId_1" index from Read Receipts collection',
	async up() {
		try {
			await ReadReceipts.col.dropIndex('roomId_1_userId_1_messageId_1');
		} catch (err: unknown) {
			console.warn('Error dropping index roomId_1_userId_1_messageId_1 from Read Receipts collection, it might have already been dropped.', err);
		}
	},
});
