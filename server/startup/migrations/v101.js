import { Migrations } from 'meteor/rocketchat:migrations';
import { Subscriptions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 101,
	up() {
		Subscriptions.update({ lastActivity:{ $exists:1 } }, { $unset: { lastActivity: '' } }, { multi: true });
	},
});
