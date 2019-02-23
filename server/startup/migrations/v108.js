import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions, Roles } from 'meteor/rocketchat:models';

Migrations.add({
	version: 108,
	up() {
		const roles = Roles.find({
			_id: { $ne: 'guest' },
			scope: 'Users',
		}).fetch().map((role) => role._id);
		Permissions.createOrUpdate('leave-c', roles);
		Permissions.createOrUpdate('leave-d', roles);
	},
});
