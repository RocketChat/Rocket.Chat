import { AppsTokens } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 273,
	async up() {
		try {
			await AppsTokens.col.dropIndex('userId_1');
			return;
		} catch (error: unknown) {
			console.warn('Error dropping index for _raix_push_app_tokens, continuing...');
			console.warn(error);
		}
	},
});
