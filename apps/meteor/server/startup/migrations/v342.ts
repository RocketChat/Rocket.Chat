import { LivechatVisitors, Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 342,
	name: 'Drop unused indexes from rocketchat_livechat_visitor and rocketchat_subscription',
	async up() {
		try {
			await LivechatVisitors.col.dropIndex('activity_1');
		} catch {
			// ignore
		}

		try {
			await Subscriptions.col.dropIndex('desktopNotifications_1');
			await Subscriptions.col.dropIndex('mobilePushNotifications_1');
			await Subscriptions.col.dropIndex('emailNotifications_1');
		} catch {
			// ignore
		}
	},
});
