Meteor.methods
	'authorization:removeRoleFromPermission': (permission, role) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-permissions'
			throw new Meteor.Error "not-authorized"

		RocketChat.models.Permissions.removeRole permission, role
