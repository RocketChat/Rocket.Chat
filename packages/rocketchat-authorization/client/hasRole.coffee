RocketChat.authz.hasRole = (userId, roleName, scope=Roles.GLOBAL_GROUP) ->
	unless Meteor.userId()
		return false

	roleName = [].concat roleName

	# per alanning:roles, returns true if user is in ANY roles
	return Roles.userIsInRole(userId, roleName, scope)
