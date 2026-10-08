import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Remove unused change-livechat-room-visitor permission',
	async up() {
		await Permissions.deleteOne({ _id: 'change-livechat-room-visitor' });
	},
});
