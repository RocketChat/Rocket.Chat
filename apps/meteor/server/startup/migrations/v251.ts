import { WebdavAccounts } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 251,
	async up() {
		await WebdavAccounts.updateMany({}, { $rename: { user_id: 'userId', server_url: 'serverURL' } });
	},
});
