import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models/server';
import { hasPermission } from '../functions/hasPermission';
import { AuthorizationUtils } from '../lib/AuthorizationUtils';
import { CONSTANTS } from '../../lib';

Meteor.methods({
	'authorization:addPermissionToRole'(permissionId, role) {
		if (AuthorizationUtils.isRoleReadOnly(role)) {
			throw new Meteor.Error('error-action-not-allowed', 'Role is readonly', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission',
			});
		}

		const uid = Meteor.userId();
		const permission = Permissions.findOneById(permissionId);

		if (!uid || !hasPermission(uid, 'access-permissions') || (permission.level === CONSTANTS.SETTINGS_LEVEL && !hasPermission(uid, 'access-setting-permissions'))) {
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
