Meteor.methods
	setUserPassword: (password) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'setUserPassword' }

		user = RocketChat.models.Users.findOneById Meteor.userId()
		if user and user.requirePasswordChange isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'setUserPassword' }

		Accounts.setPassword(Meteor.userId(), password, { logout: false });
		return RocketChat.models.Users.unsetRequirePasswordChange(Meteor.userId());

		return true;
