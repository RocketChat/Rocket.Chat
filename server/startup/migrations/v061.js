import { Migrations } from '../../migrations';
import { Users, Subscriptions } from '../../../app/models';

Migrations.add({
	version: 61,
	up() {
		Users.find({ active: false }).forEach(function(user) {
			Subscriptions.setArchivedByUsername(user.username, true);
		});
	},
});
