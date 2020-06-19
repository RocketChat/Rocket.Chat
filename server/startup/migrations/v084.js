import { Migrations } from '../../../app/migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 84,
	up() {
		if (Permissions) {
			// Update permission name, copy values from old name
			const oldPermission = Permissions.findOne('add-user-to-room');
			if (oldPermission && oldPermission.roles.length) {
				Permissions.upsert({ _id: 'add-user-to-joined-room' }, { $set: { roles: oldPermission.roles } });
				Permissions.remove({ _id: 'add-user-to-room' });
			}
		}
	},

	down() {
		if (Permissions) {
			// Revert permission name, copy values from updated name
			const newPermission = Permissions.findOne('add-user-to-joined-room');
			if (newPermission && newPermission.roles.length) {
				Permissions.upsert({ _id: 'add-user-to-room' }, { $set: { roles: newPermission.roles } });
				Permissions.remove({ _id: 'add-user-to-joined-room' });
			}
		}
	},
});
