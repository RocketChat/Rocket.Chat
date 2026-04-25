import { ReadReceipts } from '@rocket.chat/models';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Drop legacy unique index from read_receipts',

	async up() {
		try {
			await ReadReceipts.col.dropIndex('roomId_1_userId_1_messageId_1');
		} catch (e: any) {
			if (e?.code !== 27 && e?.codeName !== 'IndexNotFound') {
				throw e;
			}
		}
	},
});