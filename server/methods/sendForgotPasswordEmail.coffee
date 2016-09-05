Meteor.methods
	sendForgotPasswordEmail: (email) ->

		check email, String

		email = s.trim(email)
		user = RocketChat.models.Users.findOneByEmailAddress(email)
		regex = new RegExp("^" + s.escapeRegExp(email) + "$", 'i')

		email = _.find _.pluck(user.emails || [], 'address'), (userEmail) ->
			return regex.test(userEmail)

		if user?
			Accounts.sendResetPasswordEmail(user._id, email)
			return true

		return false
