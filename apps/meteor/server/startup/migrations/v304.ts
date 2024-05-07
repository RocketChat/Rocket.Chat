import { Analytics } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 304,
	name: 'Drop wrong index from analytics collection',
	async up() {
		const indexes = await Analytics.col.indexes();

		if (
			indexes.find(
				(index) => index.name === 'room._id_1_date_1' && index.partialFilterExpression && index.partialFilterExpression.type === 'rooms',
			)
		) {
			return;
		}

		await Analytics.col.dropIndex('room._id_1_date_1');
		await Analytics.createIndexes();
	},
});
