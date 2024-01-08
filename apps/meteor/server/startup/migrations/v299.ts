import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 299,
	name: 'Add public field to existing custom OAuth settings',
	async up() {
		await Settings.updateMany({ _id: /^Accounts_OAuth_Custom.+/, group: 'OAuth' }, { $set: { public: false } });
	},
});
