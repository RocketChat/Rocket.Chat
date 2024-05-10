import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

// Removes deprecated RDStation functionality from Omnichannel
addMigration({
	version: 268,
	async up() {
		await Settings.removeById('Livechat_RDStation_Token');
	},
});
