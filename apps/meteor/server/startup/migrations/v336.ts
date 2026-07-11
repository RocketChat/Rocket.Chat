import { Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Remove unused subscription indexes',
	async up() {
		try {
			await Promise.allSettled([
				Subscriptions.col.dropIndex('desktopNotifications_1'),
				Subscriptions.col.dropIndex('mobilePushNotifications_1'),
				Subscriptions.col.dropIndex('emailNotifications_1'),
			]);
		} catch (error: unknown) {
			console.warn('Error dropping redundant subscription indexes, continuing...');
			console.warn(error);
		}
	},
});
