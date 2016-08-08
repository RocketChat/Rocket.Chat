RocketChat.authz.hasPermission = (userId, permissionId, scope) ->
	permission = RocketChat.models.Permissions.findOne permissionId
	console.log 'permission ->', userId, scope, permission
	return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope)
