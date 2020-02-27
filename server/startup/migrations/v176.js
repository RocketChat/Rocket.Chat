import { Migrations } from '../../../app/migrations/server';
import { Permissions } from '../../../app/models/server';

const adminRolePermissions = [
	'clean-group-history',
  'clean-direct-history',
];

Migrations.add({
	version: 176,
	up() {
		Permissions.update({ _id: { $in: adminRolePermissions } }, { $addToSet: { roles: 'admin' } }, { multi: true });
	},
	down() {
		Permissions.update({ _id: { $in: adminRolePermissions } }, { $pull: { roles: 'admin' } }, { multi: true });
	},
});
