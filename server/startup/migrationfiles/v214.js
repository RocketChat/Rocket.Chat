import { Migrations } from '../migrations';
import { Permissions } from '../../models';

const roleName = 'admin';

Migrations.add({
	version: 214,
	up() {
		Permissions.update({ _id: 'toggle-room-e2e-encryption' }, { $addToSet: { roles: roleName } });
	},
});
