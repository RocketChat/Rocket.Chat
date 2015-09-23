Meteor.methods
	sendConfirmationEmail: (email) ->
		user = RocketChat.models.Users.findOneByEmailAddress email

		if user?
			Accounts.sendVerificationEmail(user._id, email)
			return true
		return false
