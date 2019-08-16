import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models/server';
import { hasPermission } from '../functions/hasPermission';
import { getUserLevelById, getLevelByRole } from '../functions/getUserLevel';
import { CONSTANTS } from '../../lib';

Meteor.methods({
	'authorization:removeRoleFromPermission'(permissionId, role) {
		const uid = Meteor.userId();
		const permission = Permissions.findOneById(permissionId);

		if (!uid || !hasPermission(uid, 'access-permissions') || (permission.level === CONSTANTS.SETTINGS_LEVEL && !hasPermission(uid, 'access-setting-permissions'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Removing permission is not allowed', {
				method: 'authorization:removeRoleFromPermission',
				action: 'Removing_permission',
			});
		}

		const userLevel = getUserLevelById(uid);
		const roleLevel = getLevelByRole(role);
		console.log(userLevel, roleLevel);
		if (userLevel < roleLevel) {
			throw new Meteor.Error('error-not-allowed', 'Adding permission for this role is not allowed', {
				method: 'authorization:addPermissionToRole',
			});
		}
		// for setting based permissions, revoke the group permission once all setting permissions
		// related to this group have been removed

		if (permission.groupPermissionId) {
			Permissions.removeRole(permission.groupPermissionId, role);
		}
		Permissions.removeRole(permission._id, role);
	},
});
