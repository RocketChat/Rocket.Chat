import { Permissions, Roles, Settings, Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 338,
	name: 'Remove Accounts_AllowAnonymousWrite setting and the anonymous role',
	async up() {
		await Settings.deleteOne({ _id: 'Accounts_AllowAnonymousWrite' });
		await Users.updateMany(
			{ roles: 'anonymous' },
			{
				$set: { active: false },
				$unset: { 'services.resume.loginTokens': 1 },
				$pull: { roles: 'anonymous' },
			},
		);
		await Permissions.updateMany({ roles: 'anonymous' }, { $pull: { roles: 'anonymous' } });
		await Roles.deleteOne({ _id: 'anonymous' });
	},
});
