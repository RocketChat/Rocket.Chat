Meteor.methods
	setUsername: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setUsername -> Invalid user")

		user = Meteor.user()

		if user.username? and not RocketChat.settings.get("Accounts_AllowUsernameChange")
			throw new Meteor.Error(403, "[methods] setUsername -> Username change not allowed")

		console.log '[methods] setUsername -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		if user.username is username
			return username

		try
			nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
		catch
			nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

		if not nameValidation.test username
			throw new Meteor.Error 'username-invalid', "#{username} is not a valid username, use only letters, numbers, dots and dashes"

		if not RocketChat.checkUsernameAvailability username
			throw new Meteor.Error 'username-unavailable', "#{username} is already in use :("

		unless RocketChat.setUsername user, username
			throw new Meteor.Error 'could-not-change-username', "Could not change username"

		return username

# Limit setting username once per minute
DDPRateLimiter.addRule
	type: 'method'
	name: 'setUsername'
	userId: (userId) ->
		# Administrators have permission to change others usernames, so don't limit those
		return not RocketChat.authz.hasPermission( userId, 'edit-other-user-info')
, 1, 60000
