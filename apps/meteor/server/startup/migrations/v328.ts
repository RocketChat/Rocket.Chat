import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 328,
	name: 'Remove Old Voip Permissions',
	async up() {
		await Permissions.deleteMany({
			_id: {
				$in: [
					'manage-voip-extensions' as IPermission['_id'],
					'view-user-voip-extension' as IPermission['_id'],
					'view-voip-extension-details' as IPermission['_id'],
				],
			},
		});
	},
});
