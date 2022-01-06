import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../models/server/raw';
import { hasPermission } from '../functions/hasPermission';

Meteor.methods({
	async 'authorization:deleteRole'(roleName) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:deleteRole',
				action: 'Accessing_permissions',
			});
		}

		const role = await Roles.findOne(roleName);
		if (!role) {
			throw new Meteor.Error('error-invalid-role', 'Invalid role', {
				method: 'authorization:deleteRole',
			});
		}

		if (role.protected) {
			throw new Meteor.Error('error-delete-protected-role', 'Cannot delete a protected role', {
				method: 'authorization:deleteRole',
			});
		}

		const users = await (await Roles.findUsersInRole(roleName)).count();

		if (users > 0) {
			throw new Meteor.Error('error-role-in-use', "Cannot delete role because it's in use", {
				method: 'authorization:deleteRole',
			});
		}

		return Roles.removeById(role.name);
	},
});
