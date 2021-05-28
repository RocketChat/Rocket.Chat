import { Migrations } from '../../../app/migrations/server';
import { Permissions } from '../../models';

const roleName = 'app';

Migrations.add({
	version: 224,
	up() {
		Permissions.update({ _id: 'message-impersonate' }, { $addToSet: { roles: roleName } });
	},
});
