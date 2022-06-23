import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 189,
	async up() {
		await Settings.removeById('Livechat_Knowledge_Enabled');
		await Settings.removeById('Livechat_Knowledge_Apiai_Key');
		await Settings.removeById('Livechat_Knowledge_Apiai_Language');
	},
});
