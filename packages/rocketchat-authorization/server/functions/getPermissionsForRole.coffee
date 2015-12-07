RocketChat.authz.getPermissionsForRole = (roleName) ->
	unless roleName
		throw new Meteor.Error 'invalid-role'

	roleNames = _.pluck(RocketChat.authz.getRoles().fetch(), 'name')
	unless roleName in roleNames
		throw new Meteor.Error 'invalid-role', "Role #{roleName} not found"

	return _.pluck(RocketChat.models.Permissions.findByRole( roleName ).fetch(), '_id')
