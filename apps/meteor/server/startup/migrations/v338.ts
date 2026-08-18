import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 338,
	name: 'Remove Accounts_AllowAnonymousWrite setting',
	async up() {
		await Settings.deleteOne({ _id: 'Accounts_AllowAnonymousWrite' });
	},
});
