import { Avatars } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 203,
	async up() {
		try {
			await Avatars.col.dropIndex('name_1');
			await Avatars.col.createIndex({ name: 1 }, { sparse: true });
		} catch (error: unknown) {
			console.warn('Error recreating index for rocketchat_avatars, continuing...');
			console.warn(error);
		}
	},
});
