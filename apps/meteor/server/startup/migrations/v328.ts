import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 328,
	name: 'Remove Old Voip Permissions',
	async up() {
		await Permissions.deleteMany({
			_id: {
				$in: ['manage-voip-extensions', 'view-user-voip-extension', 'view-voip-extension-details'],
			},
		});
	},
});
