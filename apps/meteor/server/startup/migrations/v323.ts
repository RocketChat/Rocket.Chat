import { AppLogs } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

// Remove outdated indexes on rocketchat_apps_logs
addMigration({
	version: 323,
	name: 'Remove outdated indexes on rocketchat_apps_logs',
	async up() {
		await AppLogs.col.dropIndex('appId_indexed_query');
		await AppLogs.col.dropIndex('general_logs_index');
	},
});
