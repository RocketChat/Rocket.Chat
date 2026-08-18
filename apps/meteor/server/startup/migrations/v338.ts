import { Settings, Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 338,
	name: 'Remove Accounts_AllowAnonymousWrite setting and deactivate anonymous users',
	async up() {
		await Settings.deleteOne({ _id: 'Accounts_AllowAnonymousWrite' });
		await Users.updateMany(
			{ roles: 'anonymous' },
			{
				$set: { active: false },
				$unset: { 'services.resume.loginTokens': 1 },
			},
		);
	},
});
