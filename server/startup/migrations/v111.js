// Migration to give delete channel, delete group permissions to owner
import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 111,
	up() {
		if (Permissions) {
			Permissions.update({ _id: 'delete-c' }, { $addToSet: { roles: 'owner' } });
			Permissions.update({ _id: 'delete-p' }, { $addToSet: { roles: 'owner' } });
		}
	},
});
