import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 301,
	async up() {
		const permission = await Permissions.findOneById('call-management');
		if (!permission) {
			return;
		}

		if (permission.roles.includes('user')) {
			return;
		}

		const roles = [...permission.roles, 'user'];

		await Permissions.updateOne({ _id: 'call-management' }, { $set: { roles } });
	},
});
