Meteor.methods
	setAdminStatus: (userId, admin) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] setAdminStatus -> Invalid user"

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'assign-admin-role') is true
			throw new Meteor.Error 'not-authorized', '[methods] setAdminStatus -> Not authorized'

		if admin
			RocketChat.authz.addUsersToRoles( userId, 'admin')
		else
			RocketChat.authz.removeUsersFromRoles( userId, 'admin')

		return true
