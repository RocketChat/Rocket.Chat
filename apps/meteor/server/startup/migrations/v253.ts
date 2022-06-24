import { CannedResponse } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

// This will remove old indexes and re-create the new one
addMigration({
	version: 253,
	async up() {
		try {
			await CannedResponse.col.dropIndex('shortcut_1');
			await CannedResponse.col.createIndex({ shortcut: 1 }, { unique: true });
		} catch (e) {
			// should we allow the error to kill the app? Or just log it?
			console.error('Cannot drop indexes', e);
		}
	},
});
