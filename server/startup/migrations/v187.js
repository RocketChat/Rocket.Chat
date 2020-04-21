import { Mongo } from 'meteor/mongo';

import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';
import { Notification } from '../../../app/notification-queue/server/NotificationQueue';

function convertNotification(notification) {
	try {
		const { userId } = JSON.parse(notification.query);
		const username = notification.payload.sender?.username;
		const roomName = notification.title !== username ? notification.title : '';

		const message = roomName === '' ? notification.text : notification.text.replace(`${ username }: `, '');

		return {
			_id: notification._id,
			uid: userId,
			rid: notification.payload.rid,
			ts: notification.createdAt,
			items: [{
				type: 'push',
				data: {
					roomId: notification.payload.rid,
					payload: notification.payload,
					roomName,
					username,
					message,
					badge: notification.badge,
					userId,
					category: notification.apn?.category,
				},
			}],
		};
	} catch (e) {
		//
	}
}

Migrations.add({
	version: 187,
	async up() {
		Settings.remove({ _id: 'Push_send_interval' });
		Settings.remove({ _id: 'Push_send_batch_size' });
		Settings.remove({ _id: 'Push_debug' });
		Settings.remove({ _id: 'Notifications_Always_Notify_Mobile' });

		const notificationsCollection = new Mongo.Collection('_raix_push_notifications');

		const date = new Date();
		date.setHours(date.getHours() - 2); // 2 hours ago;

		const cursor = notificationsCollection.rawCollection().find({
			createdAt: { $gte: date },
		});

		for await (const notification of cursor) {
			const newNotification = convertNotification(notification);
			if (newNotification) {
				await Notification.collection.insertOne(newNotification);
			}
		}

		notificationsCollection.rawCollection().drop();
	},
});
