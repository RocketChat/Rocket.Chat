import { Migrations } from '../../../app/migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 43,
	up() {
		if (Permissions) {
			Permissions.update({ _id: 'pin-message' }, { $addToSet: { roles: 'admin' } });
		}
	},
});
