import { Settings, Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 283,
	async up() {
		// Removing all settings & permissions related to Legacy FB Messenger integration
		await Promise.all([
			Settings.deleteMany({
				_id: {
					$in: ['Livechat_Facebook_Enabled', 'Livechat_Facebook_API_Key', 'Livechat_Facebook_API_Secret'],
				},
			}),
			Permissions.removeById('view-livechat-facebook'),
		]);
	},
});
