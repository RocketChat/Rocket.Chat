RocketChat.authz.hasRole = (userId, roleName, scope) ->
	# per alanning:roles, returns true if user is in ANY roles
	return Roles.userIsInRole(userId, [roleName], scope)
