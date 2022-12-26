import { LivechatPriority } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 284,
	async up() {
		try {
			// remove indexes from livechat_priority collection
			await LivechatPriority.col.dropIndex('dueTimeInMinutes_1');
		} catch (error) {
			// ignore
			console.log(error);
		}
	},
});
