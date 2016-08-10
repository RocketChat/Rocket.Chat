Meteor.methods
	setAdminStatus: (userId, admin) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'setAdminStatus' }

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'assign-admin-role') is true
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'setAdminStatus' }

		user = Meteor.users.findOne({ _id: userId }, { fields: { username: 1 } })
		existingsAdmins = Meteor.users.find( { roles: { $in: ['admin'] } } ).fetch();

		if admin
			return Meteor.call('authorization:addUserToRole', 'admin', user.username);
		else
			if existingsAdmins and _.isEqual(existingsAdmins.length, 1)
				throw new Meteor.Error 'error-action-not-allowed', 'Leaving the app with not admins is not allowed', { method: 'insertOrUpdateUser', action: 'Leaving the app with not admins' }

			return Meteor.call('authorization:removeUserFromRole', 'admin', user.username);
