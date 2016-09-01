RocketChat.authz.addUserRoles = (userId, roleNames, scope) ->
	if not userId or not roleNames
		return false

	user = RocketChat.models.Users.findOneById(userId)
	if not user
		throw new Meteor.Error 'error-invalid-user', 'Invalid user', { function: 'RocketChat.authz.addUserRoles' }

	roleNames = [].concat roleNames

	existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id')
	invalidRoleNames = _.difference(roleNames, existingRoleNames)
	unless _.isEmpty(invalidRoleNames)
		for role in invalidRoleNames
			RocketChat.models.Roles.createOrUpdate role

	RocketChat.models.Roles.addUserRoles(userId, roleNames, scope)

	return true
