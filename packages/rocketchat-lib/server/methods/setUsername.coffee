Meteor.methods
	setUsername: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'setUsername' })

		user = Meteor.user()

		if user.username? and not RocketChat.settings.get("Accounts_AllowUsernameChange")
			throw new Meteor.Error('error-not-allowed', "Not allowed", { method: 'setUsername' })

		if user.username is username
			return username

		try
			nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
		catch
			nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

		if not nameValidation.test username
			throw new Meteor.Error 'username-invalid', "#{username} is not a valid username, use only letters, numbers, dots, hyphens and underscores"

		if user.username != undefined
			if not username.toLowerCase() == user.username.toLowerCase()
				if not  RocketChat.checkUsernameAvailability username
					throw new Meteor.Error 'error-field-unavailable', "<strong>" + username + "</strong> is already in use :(", { method: 'setUsername', field: username }
		else
			if not  RocketChat.checkUsernameAvailability username
				throw new Meteor.Error 'error-field-unavailable', "<strong>" + username + "</strong> is already in use :(", { method: 'setUsername', field: username }

		unless RocketChat.setUsername user._id, username
			throw new Meteor.Error 'error-could-not-change-username', "Could not change username", { method: 'setUsername' }

		return username

RocketChat.RateLimiter.limitMethod 'setUsername', 1, 1000,
	userId: (userId) -> return true
