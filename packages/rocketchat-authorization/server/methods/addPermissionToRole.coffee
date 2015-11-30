Meteor.methods
	'authorization:addPermissionToRole': (permission, role) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-rocket-permissions'
			throw new Meteor.Error "not-authorized"

		console.log '[methods] authorization:addPermissionToRole -> '.green, 'arguments:', arguments

		RocketChat.models.Permissions.addRole permission, role
