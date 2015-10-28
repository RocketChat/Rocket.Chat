RocketChat.authz.removeUsersFromRoles = (userIds, roleNames, scope ) ->
	console.log '[methods] removeUsersFromRoles -> '.green, 'arguments:', arguments
	if not userIds or not roleNames
		return false

	unless _.isArray(userIds)
		userIds = [userIds]

	users = Meteor.users.find({_id: {$in : userIds}}).fetch()
	unless userIds.length is users.length
		throw new Meteor.Error 'invalid-user'

	unless _.isArray(roleNames)
		roleNames = [roleNames]

	existingRoleNames = _.pluck(RocketChat.authz.getRoles().fetch(), 'name')
	invalidRoleNames = _.difference( roleNames, existingRoleNames)
	unless _.isEmpty(invalidRoleNames)
		throw new Meteor.Error 'invalid-role'

	unless _.isString(scope)
		scope = Roles.GLOBAL_GROUP

	Roles.removeUsersFromRoles( userIds, roleNames, scope)

	return true