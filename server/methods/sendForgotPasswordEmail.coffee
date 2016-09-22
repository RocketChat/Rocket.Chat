Meteor.methods
	sendForgotPasswordEmail: (email) ->

		check email, String

		email = s.trim(email)
		user = RocketChat.models.Users.findOneByEmailAddress(email)

		if user?

			regex = new RegExp("^" + s.escapeRegExp(email) + "$", 'i')
			email = _.find _.pluck(user.emails || [], 'address'), (userEmail) ->
				return regex.test(userEmail)

			try
				Accounts.sendResetPasswordEmail(user._id, email)
			catch error
				throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }

			return true

		return false
