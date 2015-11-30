Meteor.methods
	'authorization:addPermissionToRole': (permission, role) ->
		# @TODO permission check

		RocketChat.models.Permissions.addRole permission, role
