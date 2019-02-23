import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 37,
	up() {
		if (Permissions) {

			// Find permission add-user (changed it to create-user)
			const addUserPermission = Permissions.findOne('add-user');

			if (addUserPermission) {
				Permissions.upsert({ _id: 'create-user' }, { $set: { roles: addUserPermission.roles } });
				Permissions.remove({ _id: 'add-user' });
			}
		}
	},
});
