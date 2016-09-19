Meteor.methods
	setUserActiveStatus: (userId, active) ->

		check userId, String
		check active, Boolean

		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'setUserActiveStatus' }

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'edit-other-user-active-status') is true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'setUserActiveStatus' }

		user = RocketChat.models.Users.findOneById userId

		RocketChat.models.Users.setUserActive userId, active
		RocketChat.models.Subscriptions.setArchivedByUsername user?.username, !active

		if active is false
			RocketChat.models.Users.unsetLoginTokens userId

		return true
