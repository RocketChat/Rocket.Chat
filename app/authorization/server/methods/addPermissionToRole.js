import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models/server';
import { hasPermission } from '../functions/hasPermission';

Meteor.methods({
	'authorization:addPermissionToRole'(permissionId, role) {
		const uid = Meteor.userId();
		const permission = Permissions.findOneById(permissionId);

		if (!uid || !hasPermission(uid, 'access-permissions') || (permission.level === 'setting' && !hasPermission(uid, 'access-setting-permissions'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission',
			});
		}
		// for setting-based-permissions, authorize the group access as well
		if (permission.groupPermissionId) {
			Permissions.addRole(permission.groupPermissionId, role);
		}

		return Permissions.addRole(permission._id, role);
	},
});
