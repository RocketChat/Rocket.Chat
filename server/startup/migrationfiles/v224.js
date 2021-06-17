import { Migrations } from '../migrations';
import { Permissions } from '../../models';

const roleName = 'app';

Migrations.add({
	version: 224,
	up() {
		Permissions.update({ _id: 'message-impersonate' }, { $addToSet: { roles: roleName } });
	},
});
