import { Settings } from '@rocket.chat/models';

import { db } from '../../database/utils';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 347,
	name: 'Remove legacy Meteor OAuth flow: delete the modern flow toggle, the OAuth proxy settings and the pending credentials collection',
	async up() {
		await Settings.deleteMany({
			_id: { $in: ['Accounts_OAuth_Use_Modern_Flow', 'Accounts_OAuth_Proxy_host', 'Accounts_OAuth_Proxy_services'] },
		});
		await db.dropCollection('meteor_oauth_pendingCredentials').catch(() => undefined);
	},
});
