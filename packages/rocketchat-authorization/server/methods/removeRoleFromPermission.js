import {permissionLevel} from '../../lib/rocketchat';

Meteor.methods({
	'authorization:removeRoleFromPermission'(permission, role) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')
			|| (permission.level === permissionLevel.SETTING && !RocketChat.authz.hasPermission(Meteor.userId(), 'access-setting-permissions'))
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:removeRoleFromPermission',
				action: 'Accessing_permissions'
			});
		}

		// for setting based permissions, revoke the group permission once all setting permissions
		// related to this group have been removed
		const removeStaleParentPermissions = function(permissionId, role) {
			const permission = RocketChat.models.Permissions.findOneById(permissionId);
			if (permission.groupPermissionId) {
				const groupPermission = RocketChat.models.Permissions.findOneById(permission.groupPermissionId);
				if (groupPermission.roles.indexOf(role) !== -1) {
					// the role has the group permission assigned, so check whether it's still needed
					if (RocketChat.models.Permissions.find({
						groupPermissionId: permission.groupPermissionId,
						roles: role
					}).count() === 0) {
						RocketChat.models.Permissions.removeRole(permission.groupPermissionId, role);
					}
				}
			}
		};
		RocketChat.models.Permissions.removeRole(permission, role);
		removeStaleParentPermissions(permission, role);
	}
});
