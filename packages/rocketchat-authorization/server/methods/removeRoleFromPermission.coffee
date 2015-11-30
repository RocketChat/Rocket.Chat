Meteor.methods
	'authorization:removeRoleFromPermission': (permission, role) ->
		# @TODO permission check

		RocketChat.models.Permissions.removeRole permission, role
