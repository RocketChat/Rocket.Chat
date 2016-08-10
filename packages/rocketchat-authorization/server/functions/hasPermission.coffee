atLeastOne = (userId, permissions, scope) ->
	return _.some permissions, (permissionId) ->
		permission = RocketChat.models.Permissions.findOne permissionId
		RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope)

all = (userId, permissions, scope) ->
	return _.every permissions, (permissionId) ->
		permission = RocketChat.models.Permissions.findOne permissionId
		RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope)

hasPermission = (userId, permissions, scope, strategy) ->
	unless userId
		return false

	permissions = [].concat permissions

	return strategy(userId, permissions, scope)



RocketChat.authz.hasAllPermission = (userId, permissions, scope) ->
	return hasPermission(userId, permissions, scope, all)

RocketChat.authz.hasPermission = RocketChat.authz.hasAllPermission

RocketChat.authz.hasAtLeastOnePermission = (userId, permissions, scope) ->
	return hasPermission(userId, permissions, scope, atLeastOne)
