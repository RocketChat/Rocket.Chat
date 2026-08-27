import { LivechatVisitors, Sessions, Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 343,
	async up() {
		const result = await Promise.allSettled([
			Sessions.col.dropIndex('ip_1_loginAt_-1'),
			LivechatVisitors.col.dropIndex('activity_1'),
			Subscriptions.col.dropIndex('desktopNotifications_1'),
			Subscriptions.col.dropIndex('mobilePushNotifications_1'),
			Subscriptions.col.dropIndex('emailNotifications_1'),
		]);

		result.forEach((result) => {
			if (result.status === 'rejected') {
				console.warn('Error dropping index', result.reason);
			}
		});
	},
});
