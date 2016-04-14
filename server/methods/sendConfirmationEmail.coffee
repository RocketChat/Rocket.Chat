Meteor.methods
	sendConfirmationEmail: (email) ->
		user = RocketChat.models.Users.findOneByEmailAddress s.trim(email)

		if user?
			Accounts.sendVerificationEmail(user._id, s.trim(email))
			return true
		return false
