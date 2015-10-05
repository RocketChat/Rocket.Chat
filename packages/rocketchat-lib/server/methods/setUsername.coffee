Meteor.methods
	setUsername: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setUsername -> Invalid user")

		console.log '[methods] setUsername -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		if user.username is username
			return username

		if not /^[0-9a-zA-Z-_.]+$/.test username
			throw new Meteor.Error 'username-invalid', "#{username} is not a valid username, use only letters, numbers, dots and dashes"

		if not RocketChat.checkUsernameAvailability username
			throw new Meteor.Error 'username-unavailable', "#{username} is already in use :("

		unless RocketChat.setUsername user, username
			throw new Meteor.Error 'could-not-change-username', "Could not change username"

		return username
