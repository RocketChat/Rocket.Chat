Meteor.methods
	deleteUser: (userId) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'deleteUser' }

		user = RocketChat.models.Users.findOneById Meteor.userId()
		existingsAdmins = Meteor.users.find( { roles: { $in: ['admin'] } } ).fetch();

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'delete-user') is true
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'deleteUser' }

		user = RocketChat.models.Users.findOneById userId
		unless user?
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'deleteUser' }

		if existingsAdmins and _.isEqual(existingsAdmins.length, 1)
			throw new Meteor.Error 'error-action-not-allowed', 'Leaving the app with not admins is not allowed', { method: 'removeUserFromRoom', action: 'Leaving the app with not admins' }
			
		RocketChat.deleteUser(userId)

		return true
