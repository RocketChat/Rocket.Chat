import { Migrations } from '../../../app/migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 150,
	up() {
		if (Permissions) {
			const newPermission = Permissions.findOne('view-livechat-manager');
			if (newPermission && newPermission.roles.length) {
				Permissions.upsert({ _id: 'manage-livechat-managers' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'manage-livechat-agents' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'manage-livechat-departments' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-departments' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'transfer-livechat-guest' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'add-livechat-department-agents' }, { $set: { roles: newPermission.roles } });
			}
		}
	},

	down() {
		if (Permissions) {
			// Revert permission
			Permissions.remove({ _id: 'manage-livechat-managers' });
			Permissions.remove({ _id: 'manage-livechat-agents' });
			Permissions.remove({ _id: 'manage-livechat-departments' });
			Permissions.remove({ _id: 'view-livechat-departments' });
			Permissions.remove({ _id: 'transfer-livechat-guest' });
			Permissions.remove({ _id: 'add-livechat-department-agents' });
		}
	},
});
