Meteor.methods
	'authorization:deleteRole': (roleName) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-permissions'
			throw new Meteor.Error 'error-action-not-allowed', 'Accessing permissions is not allowed', { method: 'authorization:deleteRole', action: 'Accessing_permissions' }

		role = RocketChat.models.Roles.findOne roleName
		if not role?
			throw new Meteor.Error 'error-invalid-role', 'Invalid role', { method: 'authorization:deleteRole' }

		if role.protected
			throw new Meteor.Error 'error-delete-protected-role', 'Cannot delete a protected role', { method: 'authorization:deleteRole' }

		roleScope = role.scope or 'Users'
		existingUsers = RocketChat.models[roleScope]?.findUsersInRoles?(roleName)

		if existingUsers?.count() > 0
			throw new Meteor.Error 'error-role-in-use', 'Cannot delete role because it\'s in use', { method: 'authorization:deleteRole' }

		return RocketChat.models.Roles.remove role.name
