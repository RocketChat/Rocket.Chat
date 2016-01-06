RocketChat.authz.getPermissionsForRole = (roleName) ->
	unless roleName
		throw new Meteor.Error 'invalid-role'

	role = RocketChat.models.Roles.findOne roleName
	if not role
		throw new Meteor.Error 'invalid-role', "Role #{roleName} not found"

	return _.pluck(RocketChat.models.Permissions.findByRole(roleName).fetch(), '_id')
