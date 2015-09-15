Meteor.methods
	setUserActiveStatus: (userId, active) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] setUserActiveStatus -> Invalid user'

		user = RocketChat.models.Users.findOneById Meteor.userId()
		unless user?.admin is true
			throw new Meteor.Error 'not-authorized', '[methods] setUserActiveStatus -> Not authorized'

		Meteor.users.update userId, { $set: { active: active } }

		if active is false
			Meteor.users.update userId, { $set: { "services.resume.loginTokens" : [] } }

		return true
