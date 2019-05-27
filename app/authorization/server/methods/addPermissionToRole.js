import { Meteor } from 'meteor/meteor';
import { Permissions } from '../../../models';
import { hasPermission } from '../functions/hasPermission';

Meteor.methods({
	'authorization:addPermissionToRole'(permission, role) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'access-permissions')
			|| (permission.level === 'setting' && !hasPermission(Meteor.userId(), 'access-setting-permissions'))
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission',
			});
		}

		// for setting-based-permissions, authorize the group access as well
		const addParentPermissions = function(permissionId, role) {
			const permission = Permissions.findOneById(permissionId);
			if (permission.groupPermissionId) {
				const groupPermission = Permissions.findOneById(permission.groupPermissionId);
				if (groupPermission.roles.indexOf(role) === -1) {
					Permissions.addRole(permission.groupPermissionId, role);
				}
			}
		};

		addParentPermissions(permission, role);
		return Permissions.addRole(permission, role);
	},
});
