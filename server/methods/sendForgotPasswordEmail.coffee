Meteor.methods
	sendForgotPasswordEmail: (email) ->
		user = RocketChat.models.Users.findOneByEmailAddress s.trim(email.toLowerCase())

		if user?
			Accounts.sendResetPasswordEmail(user._id, s.trim(email))
			return true
		return false
