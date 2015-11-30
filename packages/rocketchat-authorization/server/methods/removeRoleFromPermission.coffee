Meteor.methods
	'authorization:removeRoleFromPermission': (permission, role) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-rocket-permissions'
			throw new Meteor.Error "not-authorized"

		console.log '[methods] authorization:removeRoleFromPermission -> '.green, 'arguments:', arguments

		RocketChat.models.Permissions.removeRole permission, role
