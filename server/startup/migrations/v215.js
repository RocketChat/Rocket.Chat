import { Migrations } from '../../../app/migrations/server';
import { Permissions } from '../../../app/models/server';

const roleName = 'user';

Migrations.add({
	version: 215,
	up() {
		Permissions.update({ _id: 'message-impersonate' }, { $addToSet: { roles: roleName } });
	},
});
