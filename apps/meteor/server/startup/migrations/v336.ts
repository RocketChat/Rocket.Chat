import { addMigration } from '../../lib/migrations';
import { getRawCollection } from '@rocket.chat/models';

addMigration({
	version: 336,
	name: 'Drop legacy unique index from read_receipts',
	async up() {
		const collection = getRawCollection('read_receipts');

		const indexes = await collection.indexes();

		const targetIndex = indexes.find((idx) => {
			return (
				idx.unique === true &&
				idx.key &&
				Object.keys(idx.key).length === 3 &&
				idx.key.roomId === 1 &&
				idx.key.userId === 1 &&
				idx.key.messageId === 1
			);
		});

		if (targetIndex) {
			await collection.dropIndex(targetIndex.name);
		}
	},
});