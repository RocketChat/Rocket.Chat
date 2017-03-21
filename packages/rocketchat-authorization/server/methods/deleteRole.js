Meteor.methods({
	'authorization:deleteRole'(roleName) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:deleteRole',
				action: 'Accessing_permissions'
			});
		}

		const role = RocketChat.models.Roles.findOne(roleName);
		if (!role) {
			throw new Meteor.Error('error-invalid-role', 'Invalid role', {
				method: 'authorization:deleteRole'
			});
		}

		if (role.protected) {
			throw new Meteor.Error('error-delete-protected-role', 'Cannot delete a protected role', {
				method: 'authorization:deleteRole'
			});
		}

		const roleScope = role.scope || 'Users';
		const model = RocketChat.models[roleScope];
		const existingUsers = model && model.findUsersInRoles && model.findUsersInRoles(roleName);

		if (existingUsers && existingUsers.count() > 0) {
			throw new Meteor.Error('error-role-in-use', 'Cannot delete role because it\'s in use', {
				method: 'authorization:deleteRole'
			});
		}

		return RocketChat.models.Roles.remove(role.name);
	}
});
