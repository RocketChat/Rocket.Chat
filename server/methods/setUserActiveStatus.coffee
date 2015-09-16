Meteor.methods
	setUserActiveStatus: (userId, active) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] setUserActiveStatus -> Invalid user'

		user = RocketChat.models.Users.findOneById Meteor.userId()
		unless user?.admin is true
			throw new Meteor.Error 'not-authorized', '[methods] setUserActiveStatus -> Not authorized'

		RocketChat.models.Users.setUserActive userId, active

		if active is false
			RocketChat.models.Users.unsetLoginTokens userId

		return true
