Meteor.methods
	sendConfirmationEmail: (email) ->

		check email, String

		user = RocketChat.models.Users.findOneByEmailAddress s.trim(email)

		if user?
			try
				Accounts.sendVerificationEmail(user._id, s.trim(email))
			catch error
				throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }

			return true
		return false
