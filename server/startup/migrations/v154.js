import { Migrations } from '../../migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 154,
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
				Permissions.upsert({ _id: 'view-livechat-current-chats' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-analytics' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-real-time-monitoring' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-triggers' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-customfields' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-installation' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-appearance' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-webhooks' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-facebook' }, { $set: { roles: newPermission.roles } });
				Permissions.upsert({ _id: 'view-livechat-officeHours' }, { $set: { roles: newPermission.roles } });
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
			Permissions.remove({ _id: 'view-livechat-current-chats' });
			Permissions.remove({ _id: 'view-livechat-analytics' });
			Permissions.remove({ _id: 'view-livechat-real-time-monitoring' });
			Permissions.remove({ _id: 'view-livechat-triggers' });
			Permissions.remove({ _id: 'view-livechat-customfields' });
			Permissions.remove({ _id: 'view-livechat-installation' });
			Permissions.remove({ _id: 'view-livechat-appearance' });
			Permissions.remove({ _id: 'view-livechat-webhooks' });
			Permissions.remove({ _id: 'view-livechat-facebook' });
			Permissions.remove({ _id: 'view-livechat-officeHours' });
		}
	},
});
