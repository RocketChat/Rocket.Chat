RocketChat.authz.hasPermission = (userId, permissionId, scope) ->
	permission = RocketChat.models.Permissions.findOne permissionId
	return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope)
