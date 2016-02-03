RocketChat.authz.getUsersInRole = (roleName, scope, options) ->
	return RocketChat.models.Roles.findUsersInRole(roleName, scope, options)
