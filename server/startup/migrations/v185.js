import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 185,
	async up() {
		Settings.remove({ _id: 'Push_send_interval' });
		Settings.remove({ _id: 'Push_send_batch_size' });
		Settings.remove({ _id: 'Push_debug' });
		Settings.remove({ _id: 'Notifications_Always_Notify_Mobile' });

		// const date = new Date();
		// date.setHours(date.getHours() - 2); // 2 hours ago;

		// Remove all records older than 2h
		// notificationsCollection.rawCollection().removeMany({ createdAt: { $lt: date } });
	},
});
