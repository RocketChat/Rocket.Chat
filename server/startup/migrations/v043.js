import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 43,
	up() {
		if (Permissions) {
			Permissions.update({ _id: 'pin-message' }, { $addToSet: { roles: 'admin' } });
		}
	},
});
