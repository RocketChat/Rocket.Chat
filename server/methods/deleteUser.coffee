Meteor.methods
	deleteUser: (userId) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'deleteUser' }

		user = RocketChat.models.Users.findOneById Meteor.userId()

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'delete-user') is true
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'deleteUser' }

		user = RocketChat.models.Users.findOneById userId
		unless user?
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'deleteUser' }

		RocketChat.deleteUser(userId)

		return true
