import { Statistics } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Remove redundant statistics createdAt descending index',
	async up() {
		try {
			await Statistics.col.dropIndex('createdAt_-1');
		} catch {
			// Index might not exist on fresh installations
		}
	},
});
