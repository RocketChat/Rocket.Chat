Meteor.methods
	deleteUser: (userId) ->

		check userId, String

		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'deleteUser' }

		user = RocketChat.models.Users.findOneById Meteor.userId()

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'delete-user') is true
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'deleteUser' }

		user = RocketChat.models.Users.findOneById userId
		unless user?
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'deleteUser' }

		# prevent deleting last admin
		adminCount = Meteor.users.find({ roles: { $in: ['admin'] } }).count()
		userIsAdmin = user.roles.indexOf('admin') > -1
		if adminCount is 1 and userIsAdmin
			throw new Meteor.Error 'error-action-not-allowed', 'Leaving the app without admins is not allowed', { method: 'deleteUser', action: 'Remove_last_admin' }

		RocketChat.deleteUser(userId)

		return true
