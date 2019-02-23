import { Migrations } from 'meteor/rocketchat:migrations';
import { Users, Subscriptions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 61,
	up() {
		Users.find({ active: false }).forEach(function(user) {
			Subscriptions.setArchivedByUsername(user.username, true);
		});
	},
});
