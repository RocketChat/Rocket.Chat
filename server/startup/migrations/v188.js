import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

const newRolePermissions = [
	'view-d-room',
	'view-p-room',
];

const roleName = 'guest';

addMigration({
	version: 188,
	up() {
		Permissions.update({ _id: { $in: newRolePermissions } }, { $addToSet: { roles: roleName } }, { multi: true });
	},
});
