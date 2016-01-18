Meteor.methods
	setEmail: (email) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setEmail -> Invalid user")

		user = Meteor.user()

		if not RocketChat.settings.get("Accounts_AllowEmailChange")
			throw new Meteor.Error(403, "[methods] setEmail -> E-mail change not allowed")

		if user.emails?[0]?.address is email
			return email

		emailValidation = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
		if not emailValidation.test email
			throw new Meteor.Error 'email-invalid', "#{email} is not a valid e-mail"

		if not RocketChat.checkEmailAvailability email
			throw new Meteor.Error 'email-unavailable', "#{email} is already in use :("

		unless RocketChat.setEmail user._id, email
			throw new Meteor.Error 'could-not-change-email', "Could not change email"

		return email

RocketChat.RateLimiter.limitMethod 'setEmail', 1, 1000,
	userId: (userId) -> return true
