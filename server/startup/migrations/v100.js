import { Migrations } from 'meteor/rocketchat:migrations';
import { Subscriptions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 100,
	up() {
		Subscriptions.update({ audioNotification:{ $exists:1 } }, { $rename: { audioNotification: 'audioNotifications' } });
	},
});
