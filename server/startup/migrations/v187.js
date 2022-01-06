import { Mongo } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';
import { NotificationQueue, Settings } from '../../../app/models/server/raw';

function convertNotification(notification) {
	try {
		const { userId } = JSON.parse(notification.query);
		const username = notification.payload.sender?.username;
		const roomName = notification.title !== username ? notification.title : '';

		const message = roomName === '' ? notification.text : notification.text.replace(`${username}: `, '');

		return {
			_id: notification._id,
			uid: userId,
			rid: notification.payload.rid,
			mid: notification.payload.messageId,
			ts: notification.createdAt,
			items: [
				{
					type: 'push',
					data: {
						payload: notification.payload,
						roomName,
						username,
						message,
						badge: notification.badge,
						category: notification.apn?.category,
					},
				},
			],
		};
	} catch (e) {
		//
	}
}

async function migrateNotifications() {
	const notificationsCollection = new Mongo.Collection('_raix_push_notifications');

	const date = new Date();
	date.setHours(date.getHours() - 2); // 2 hours ago;

	const cursor = notificationsCollection.rawCollection().find({
		createdAt: { $gte: date },
	});
	for await (const notification of cursor) {
		const newNotification = convertNotification(notification);
		if (newNotification) {
			await NotificationQueue.insertOne(newNotification);
		}
	}
	return notificationsCollection.rawCollection().drop();
}

addMigration({
	version: 187,
	async up() {
		await Settings.removeById('Push_send_interval');
		await Settings.removeById('Push_send_batch_size');
		await Settings.removeById('Push_debug');
		await Settings.removeById('Notifications_Always_Notify_Mobile');

		try {
			await migrateNotifications();
		} catch (err) {
			// Ignore if the collection does not exist
			if (!err.code || err.code !== 26) {
				throw err;
			}
		}
	},
});
