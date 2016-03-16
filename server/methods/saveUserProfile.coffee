Meteor.methods
	saveUserProfile: (settings) ->
		unless settings.currentPassword
			throw new Meteor.Error('missing-current-password', "[methods] saveUserProfile -> Missing current password")

		unless RocketChat.settings.get("Accounts_AllowUserProfileChange")
			throw new Meteor.Error(403, "[methods] saveUserProfile -> Invalid access")

		if Meteor.userId()
			user = RocketChat.models.Users.findOneById(Meteor.userId());

			passCheck = Accounts._checkPassword(user, { digest: settings.currentPassword, algorithm: 'sha-256' });
			if passCheck.error
				throw new Meteor.Error('invalid-password', "[methods] saveUserProfile -> Invalid password");

			if settings.newPassword?
				Accounts.setPassword Meteor.userId(), settings.newPassword, { logout: false }

			if settings.realname?
				Meteor.call 'setRealName', settings.realname

			if settings.username?
				Meteor.call 'setUsername', settings.username

			if settings.email?
				Meteor.call 'setEmail', settings.email

			profile = {}

			RocketChat.models.Users.setProfile Meteor.userId(), profile

			return true
