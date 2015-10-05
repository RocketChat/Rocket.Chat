RocketChat.authz.getUsersInRole = (roleName, scope) ->
	# alanning:roles doc says this is an expensive operation
	unless _.isString(scope)
		scope = Roles.GLOBAL_GROUP
		
	return Roles.getUsersInRole(roleName, scope)