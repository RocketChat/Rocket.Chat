Meteor.methods
	setAdminStatus: (userId, admin) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'setAdminStatus' }

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'assign-admin-role') is true
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'setAdminStatus' }

		user = Meteor.users.findOne({ _id: userId }, { fields: { username: 1 } })

		if admin
			return Meteor.call('authorization:addUserToRole', 'admin', user.username);
		else
			return Meteor.call('authorization:removeUserFromRole', 'admin', user.username);
