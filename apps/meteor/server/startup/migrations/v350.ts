import { Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

const batchSize = 1000;

addMigration({
	version: 350,
	name: 'Rename users freeSwitchExtension attribute to sipExtension',
	async up() {
		const { col } = Users;

		let ids: string[];
		do {
			ids = (await col.find({ freeSwitchExtension: { $exists: true } }, { projection: { _id: 1 }, limit: batchSize }).toArray()).map(
				({ _id }) => _id,
			);

			if (ids.length) {
				await col.updateMany({ _id: { $in: ids } }, { $rename: { freeSwitchExtension: 'sipExtension' } });
			}
		} while (ids.length === batchSize);

		await col.dropIndex('freeSwitchExtension_1').catch(() => undefined);
	},
});
