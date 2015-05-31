Meteor.methods
	sendForgotPasswordEmail: (email) ->
		user = Meteor.users.findOne {'emails.address': email}

		if user?
			Accounts.sendResetPasswordEmail(user._id, email)
			return true
		return false
