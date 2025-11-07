import { AppLogs } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

// Remove outdated indexes on rocketchat_apps_logs
addMigration({
	version: 323,
	name: 'Remove outdated indexes on rocketchat_apps_logs',
	async up() {
		// Idempotent drops: ignore "IndexNotFound" (code 27)
		try {
			await AppLogs.col.dropIndex('appId_indexed_query');
		} catch (e: any) {
			if (e?.code !== 27 && e?.codeName !== 'IndexNotFound') {
				throw e;
			}
		}

		try {
			await AppLogs.col.dropIndex('general_logs_index');
		} catch (e: any) {
			if (e?.code !== 27 && e?.codeName !== 'IndexNotFound') {
				throw e;
			}
		}
	},
});
