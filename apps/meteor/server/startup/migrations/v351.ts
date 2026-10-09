import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 351,
	name: 'Separate global invite management from room invite creation',
	async up() {
		await Permissions.create('manage-invite-links', ['admin']);
	},
});
