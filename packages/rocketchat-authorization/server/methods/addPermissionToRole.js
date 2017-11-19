Meteor.methods({
	'authorization:addPermissionToRole'(permission, role) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission'
			});
		}

		const addParentPermissions = function(permissionId, role) {
			const permission = RocketChat.models.Permissions.findOneById(permissionId);
			if (permission.groupPermissionId) {
				const groupPermission = RocketChat.models.Permissions.findOneById(permission.groupPermissionId);
				if (groupPermission.roles.indexOf(role) === -1) {
					RocketChat.models.Permissions.addRole(permission.groupPermissionId, role);
				}
			}
		};

		addParentPermissions(permission, role);
		return RocketChat.models.Permissions.addRole(permission, role);
	}
});
