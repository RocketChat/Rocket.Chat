Meteor.methods
	registerAnonymousUser: (username) ->
		if RocketChat.settings.get("Accounts_AnonymousAccess") not in ['Read', 'ReadWrite']
			throw new Meteor.Error 'anonymous-registration-not-allowed', 'Anonymous registration is not alllowed'

		try
			nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
		catch
			nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

		if not nameValidation.test username
			throw new Meteor.Error 'username-invalid', "#{username} is not a valid username, use only letters, numbers, dots and dashes"

		if not RocketChat.checkUsernameAvailability username
			throw new Meteor.Error 'username-unavailable', "#{username} is already in use :("

		password = Random.id()
		userData =
			username: username
			password: password

		userId = Accounts.createUser userData
		return password
