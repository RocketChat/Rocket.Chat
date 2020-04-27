import { Migrations } from '../../../app/migrations/server';
import { Permissions } from '../../../app/models/server';

const newRolePermissions = [
	'view-d-room',
	'view-p-room',
];

const roleName = 'guest';

Migrations.add({
	version: 188,
	up() {
		Permissions.update({ _id: { $in: newRolePermissions } }, { $addToSet: { roles: roleName } }, { multi: true });
	},
});
