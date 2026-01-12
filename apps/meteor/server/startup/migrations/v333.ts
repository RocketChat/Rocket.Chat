import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 333,
	name: 'Add view-directory permission',
	async up() {
		await Permissions.create('view-directory', ['admin', 'user']);
	},
});
