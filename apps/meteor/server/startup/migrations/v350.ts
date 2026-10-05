import { Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

const batchSize = 1000;

addMigration({
	version: 350,
	name: 'Rename users freeSwitchExtension attribute to sipExtension',
	async up() {
		let ids: string[];
		do {
			ids = await Users.find({ freeSwitchExtension: { $exists: true } }, { projection: { _id: 1 }, limit: batchSize })
				.map(({ _id }) => _id)
				.toArray();

			if (ids.length) {
				await Users.updateMany({ _id: { $in: ids } }, { $rename: { freeSwitchExtension: 'sipExtension' } });
			}
		} while (ids.length === batchSize);

		await Users.col.dropIndex('freeSwitchExtension_1').catch(() => undefined);
	},
});
