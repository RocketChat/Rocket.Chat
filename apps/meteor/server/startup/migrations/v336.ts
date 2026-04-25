import { addMigration } from '../../lib/migrations';
import { ReadReceipts } from '@rocket.chat/models';

addMigration({
	version: 336,
	name: 'Drop legacy unique index from read_receipts',

	async up() {
		const collection = ReadReceipts.col;

		const indexes = await collection.indexes();

		const matchingIndexes = indexes.filter((idx) => {
			const keys = idx.key || {};

			return (
				Object.keys(keys).length === 3 && 
				keys.roomId === 1 &&
				keys.userId === 1 &&
				keys.messageId === 1
			);
		});

		for (const idx of matchingIndexes) {
			if (idx.name) {
				await collection.dropIndex(idx.name);
			}
		}
	},
});