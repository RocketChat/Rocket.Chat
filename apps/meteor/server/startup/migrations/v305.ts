import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 305,
	async up() {
		await Permissions.deleteOne({ _id: 'view-history' });
	},
});
