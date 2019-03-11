import { Migrations } from 'meteor/rocketchat:migrations';
import { getUsersInRole, removeUserFromRoles } from 'meteor/rocketchat:authorization';

Migrations.add({
	version: 82,
	up() {
		const admins = getUsersInRole('admin').fetch();
		if (admins.length === 1 && admins[0]._id === 'rocket.cat') {
			removeUserFromRoles('rocket.cat', 'admin');
		}
	},
});
