import { Migrations } from '../../../app/migrations';
import { getUsersInRole, removeUserFromRoles } from '../../../app/authorization';

Migrations.add({
	version: 82,
	up() {
		const admins = getUsersInRole('admin').fetch();
		if (admins.length === 1 && admins[0]._id === 'rocket.cat') {
			removeUserFromRoles('rocket.cat', 'admin');
		}
	},
});
