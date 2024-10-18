import { LivechatRooms, Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 312,
	async up() {
		try {
			await Promise.allSettled([
				LivechatRooms.col.dropIndex('v.token_1'),
				Rooms.col.dropIndex('t_1'),
				Subscriptions.col.dropIndex('rid_1'),
				Users.col.dropIndex('active_1'),
			]);
		} catch (error: unknown) {
			console.warn('Error dropping redundant indexes, continuing...');
			console.warn(error);
		}
	},
});
