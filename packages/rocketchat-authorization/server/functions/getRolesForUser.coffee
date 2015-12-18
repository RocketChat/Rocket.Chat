RocketChat.authz.getRolesForUser = (userId, scope) ->
	# returns roles for the given scope as well as the global scope
	unless scope
		scope = Roles.GLOBAL_GROUP

	return Roles.getRolesForUser(userId, scope)
