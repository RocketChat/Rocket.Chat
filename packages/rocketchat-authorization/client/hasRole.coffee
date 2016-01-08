RocketChat.authz.hasRole = (userId, roleNames, scope) ->
	roleNames = [].concat roleNames
	return RocketChat.models.Roles.isUserInRoles(userId, roleNames, scope) # true if user is in ANY role
