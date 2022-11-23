import { LivechatPriority } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 283,
	async up() {
		try {
			// remove indexes from livechat_priority collection
			await LivechatPriority.col.dropIndex('dueTimeInMinutes_1');
		} catch (error) {
			// ignore
			console.log(error);
		}
		try {
			await LivechatPriority.col.dropIndex('name_1');
		} catch (error) {
			// ignore
			console.log(error);
		}
	},
});
