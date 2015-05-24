Meteor.methods
	sendForgotPasswordEmail: (email) ->
		user = Meteor.users.findOne {'email.address': email}

		if user?
			Accounts.sendResetPasswordEmail(user._id, email)
			return true
		return false
