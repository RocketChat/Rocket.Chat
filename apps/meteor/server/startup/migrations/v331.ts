import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 331,
	name: 'Remove view-livechat-current-chats permission',
	async up() {
		await Permissions.deleteOne({ _id: 'view-livechat-current-chats' });
	},
});
