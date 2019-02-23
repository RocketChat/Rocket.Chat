import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 127,
	up() {
		if (Permissions) {

			const newPermission = Permissions.findOne('view-livechat-manager');
			if (newPermission && newPermission.roles.length) {
				Permissions.upsert({ _id: 'remove-closed-livechat-rooms' }, { $set: { roles: newPermission.roles } });
			}
		}
	},

	down() {
		if (Permissions) {

			// Revert permission
			Permissions.remove({ _id: 'remove-closed-livechat-rooms' });
		}
	},
});
