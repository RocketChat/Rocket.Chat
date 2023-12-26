import { Analytics } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 304,
	name: 'Drop wrong index from analytics collection',
	async up() {
		await Analytics.col.dropIndex('room._id_1_date_1');
		await Analytics.createIndexes();
	},
});
