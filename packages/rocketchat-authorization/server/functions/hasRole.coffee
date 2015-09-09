RocketChat.authz.hasRole = (userId, roleName, scope) ->
	console.log '[methods] hasRoles -> '.green, 'arguments:', arguments
	# per alanning:roles, returns true if user is in ANY roles
	return Roles.userIsInRole(userId, [roleName], scope)