import { Migrations } from '../../../app/migrations';
import { Subscriptions } from '../../../app/models';

Migrations.add({
	version: 100,
	up() {
		Subscriptions.update({ audioNotification:{ $exists:1 } }, { $rename: { audioNotification: 'audioNotifications' } });
	},
});
