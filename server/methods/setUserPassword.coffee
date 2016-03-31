Meteor.methods
	setUserPassword: (password) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] setUserPassword -> Invalid user'

		user = RocketChat.models.Users.findOneById Meteor.userId()
		if user and user.requirePasswordChange isnt true
			throw new Meteor.Error 'not-authorized', '[methods] setUserPassword -> Not authorized'

		Accounts.setPassword(Meteor.userId(), password, { logout: false });
		return RocketChat.models.Users.unsetRequirePasswordChange(Meteor.userId());

		return true;