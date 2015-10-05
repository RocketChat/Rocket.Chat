Meteor.methods
	sendForgotPasswordEmail: (email) ->
		user = RocketChat.models.Users.findOneByEmailAddress email

		if user?
			Accounts.sendResetPasswordEmail(user._id, email)
			return true
		return false
