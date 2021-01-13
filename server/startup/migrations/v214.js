import { Migrations } from '../../../app/migrations/server';
import { Permissions } from '../../../app/models/server';

const roleName = 'admin';

Migrations.add({
	version: 213,
	up() {
		Permissions.update({ _id: 'toggle-room-e2e-encryption' }, { $addToSet: { roles: roleName } });
	},
});
