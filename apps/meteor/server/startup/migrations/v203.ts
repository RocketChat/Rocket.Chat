import { Avatars } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 203,
	async up() {
		await Avatars.col.dropIndex('name_1');
		await Avatars.col.createIndex({ name: 1 }, { sparse: true });
	},
});
