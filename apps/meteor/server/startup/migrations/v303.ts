import { Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { getNewUserRoles } from '../../services/user/lib/getNewUserRoles';

addMigration({
	version: 303,
	name: 'Add default roles to users without roles field',
	async up() {
		const defaultRoles = getNewUserRoles();

		await Users.updateMany(
			{
				roles: { $exists: false },
			},
			{ $set: { roles: defaultRoles } },
		);
	},
});
