RocketChat.authz.hasPermission = (userId, permissionId, scope) ->
	console.log '[methods] hasPermission -> '.green, 'arguments:', arguments

	# get user's roles
	roles = RocketChat.authz.getRolesForUser(userId, scope)

	# get permissions for user's roles
	permissions = []
	for role in roles
		permissions = permissions.concat( RocketChat.authz.getPermissionsForRole( role ))
	# may contain duplicate, but doesn't matter
	return permissionId in permissions