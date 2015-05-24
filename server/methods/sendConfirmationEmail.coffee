Meteor.methods
	sendConfirmationEmail: (email) ->
		user = Meteor.users.findOne {'email.address': email}

		if user?
			Accounts.sendVerificationEmail(user._id, email)
			return true
		return false
