RocketChat.authz.getPermissionsForRole = (roleName) ->
	unless roleName
		throw new Meteor.Error 'invalid-role'

	roleNames = _.pluck(RocketChat.authz.getRoles().fetch(), 'name')
	unless roleName in roleNames
		throw new Meteor.Error 'invalid-role'

	return _.pluck(ChatPermissions.find({roles : roleName }).fetch(), '_id')