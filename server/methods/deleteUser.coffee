Meteor.methods
	deleteUser: (userId) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteUser -> Invalid user")

		user = RocketChat.models.Users.findOneById Meteor.userId()

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'delete-user') is true
			throw new Meteor.Error 'not-authorized', '[methods] deleteUser -> Not authorized'

		user = RocketChat.models.Users.findOneById userId
		unless user?
			throw new Meteor.Error 'not-found', '[methods] deleteUser -> User not found'

		RocketChat.deleteUser(userId)

		return true
