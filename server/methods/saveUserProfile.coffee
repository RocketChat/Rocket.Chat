Meteor.methods
	saveUserProfile: (settings) ->
		unless RocketChat.settings.get("Accounts_AllowUserProfileChange")
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'saveUserProfile' })

		unless Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'saveUserProfile' }

		user = RocketChat.models.Users.findOneById Meteor.userId()

		checkPassword = (user, currentPassword) ->
			unless s.trim(user?.services?.password?.bcrypt)
				return true

			unless currentPassword
				return false

			passCheck = Accounts._checkPassword(user, { digest: currentPassword, algorithm: 'sha-256' });
			if passCheck.error
				return false
			return true

		if settings.newPassword?
			unless checkPassword user, settings.currentPassword
				throw new Meteor.Error('error-invalid-password', 'Invalid password', { method: 'saveUserProfile' })
			Accounts.setPassword Meteor.userId(), settings.newPassword, { logout: false }

		if settings.realname?
			Meteor.call 'setRealName', settings.realname

		if settings.username?
			Meteor.call 'setUsername', settings.username

		if settings.email?
			unless checkPassword user, settings.currentPassword
				throw new Meteor.Error('error-invalid-password', 'Invalid password', { method: 'saveUserProfile' })
			Meteor.call 'setEmail', settings.email

		profile = {}

		RocketChat.models.Users.setProfile Meteor.userId(), profile

		return true
