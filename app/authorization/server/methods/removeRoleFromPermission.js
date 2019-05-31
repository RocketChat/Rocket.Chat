import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models';
import { hasPermission } from '../functions/hasPermission';

Meteor.methods({
	'authorization:removeRoleFromPermission'(permission, role) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'access-permissions')
			|| (permission.level === 'setting' && !hasPermission(Meteor.userId(), 'access-setting-permissions'))
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:removeRoleFromPermission',
				action: 'Accessing_permissions',
			});
		}

		// for setting based permissions, revoke the group permission once all setting permissions
		// related to this group have been removed
		const removeStaleParentPermissions = function(permissionId, role) {
			const permission = Permissions.findOneById(permissionId);
			if (permission.groupPermissionId) {
				const groupPermission = Permissions.findOneById(permission.groupPermissionId);
				if (groupPermission.roles.indexOf(role) !== -1) {
					// the role has the group permission assigned, so check whether it's still needed
					if (Permissions.find({
						groupPermissionId: permission.groupPermissionId,
						roles: role,
					}).count() === 0) {
						Permissions.removeRole(permission.groupPermissionId, role);
					}
				}
			}
		};
		Permissions.removeRole(permission, role);
		removeStaleParentPermissions(permission, role);
	},
});
