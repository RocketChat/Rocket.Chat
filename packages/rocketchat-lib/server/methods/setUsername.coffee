Meteor.methods
	setUsername: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setUsername -> Invalid user")

		console.log '[methods] setUsername -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		if user.username is username
			return username

		if not /^[0-9a-zA-Z-_.]+$/.test username
			throw new Meteor.Error 'username-invalid'

		if not RocketChat.checkUsernameAvailability username
			throw new Meteor.Error 'username-unavailable'

		unless RocketChat.setUsername user, username
			throw new Meteor.Error 'could-not-change-username', t('Could_not_change_username')

		return username