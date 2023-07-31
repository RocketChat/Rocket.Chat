import { Users } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { parseCSV } from '../../../lib/utils/parseCSV';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 303,
	name: 'Add default roles to users without roles field',
	async up() {
		const defaultRoles = settings.get('Accounts_Registration_Users_Default_Roles');

		await Users.updateMany(
			{
				roles: { $exists: false },
			},
			{ $set: { roles: defaultRoles ? parseCSV(String(defaultRoles)) : [] } },
		);
	},
});
