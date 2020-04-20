import { notificationsCollection } from '../../../app/push/server';
import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 181,
	async up() {
		Settings.update({ _id: 'Push_send_interval', value: 5000 }, { $set: { value: 2000 } });
		Settings.update({ _id: 'Push_send_batch_size', value: 10 }, { $set: { value: 100 } });

		const date = new Date();
		date.setHours(date.getHours() - 2); // 2 hours ago;

		// Remove all records older than 2h
		notificationsCollection.rawCollection().removeMany({ createdAt: { $lt: date } });
	},
});
