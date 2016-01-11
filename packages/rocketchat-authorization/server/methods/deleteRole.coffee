Meteor.methods
	'authorization:deleteRole': (roleName) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-permissions'
			throw new Meteor.Error "not-authorized"

		role = RocketChat.models.Roles.findOne roleName
		if not role?
			throw new Meteor.Error 'invalid-role'

		if role.protected
			throw new Meteor.Error 'protected-role', 'Cannot_delete_a_protected_role'

		roleScope = role.scope or 'Users'
		existingUsers = RocketChat.models[roleScope]?.findUsersInRoles?(roleName)

		if existingUsers?.count() > 0
			throw new Meteor.Error 'role-in-use', 'Cannot_delete_role_because_its_in_use'

		return RocketChat.models.Roles.remove role.name
