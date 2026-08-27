import { LivechatVisitors, Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 342,
	name: 'Drop unused indexes from rocketchat_livechat_visitor and rocketchat_subscription',
	async up() {
		try {
			await Subscriptions.col.dropIndex('desktopNotifications_1');
			await Subscriptions.col.dropIndex('mobilePushNotifications_1');
			await Subscriptions.col.dropIndex('emailNotifications_1');
			// activity_1 stopped being created in 7.3 while the subscription indexes lasted until 8.7,
			// so it must be dropped last: an IndexNotFound here aborts the try block
			await LivechatVisitors.col.dropIndex('activity_1');
		} catch (e: any) {
			if (e?.code !== 27 && e?.codeName !== 'IndexNotFound') {
				throw e;
			}
		}
	},
});
