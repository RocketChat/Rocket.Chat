import { Migrations } from '../migrations';
import { Permissions } from '../../models';

const roleName = 'user';

Migrations.add({
	version: 223,
	up() {
		Permissions.update({ _id: 'message-impersonate' }, { $addToSet: { roles: roleName } });
	},
});
