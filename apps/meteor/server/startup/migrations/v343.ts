import { LivechatVisitors, Sessions, Subscriptions, ModerationReports, getCollectionName } from '@rocket.chat/models';

import { db } from '../../database/utils';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 343,
	async up() {
		const readReceipts = db.collection(getCollectionName('read_receipts'));

		const result = await Promise.allSettled([
			Sessions.col.dropIndex('ip_1_loginAt_-1'),
			LivechatVisitors.col.dropIndex('activity_1'),
			Subscriptions.col.dropIndex('desktopNotifications_1'),
			Subscriptions.col.dropIndex('mobilePushNotifications_1'),
			Subscriptions.col.dropIndex('emailNotifications_1'),
			readReceipts.dropIndex('roomId_1_userId_1_messageId_1'),
			ModerationReports.col.dropIndex('ts_1_reports.ts_1'),
			ModerationReports.col.dropIndex('message.u._id_1_ts_1'),
			ModerationReports.col.dropIndex('reportedUser._id_1_ts_1'),
			ModerationReports.col.dropIndex('message.rid_1_ts_1'),
			ModerationReports.col.dropIndex('message._id_1_ts_1'),
			ModerationReports.col.dropIndex('userId_1_ts_1'),
		]);

		result.forEach((result) => {
			if (result.status === 'rejected') {
				console.warn('Error dropping index', result.reason);
			}
		});
	},
});
