Meteor.methods
	saveUserProfile: (settings) ->
		unless RocketChat.settings.get("Accounts_AllowUserProfileChange")
			throw new Meteor.Error(403, "[methods] saveUserProfile -> Invalid access")

		if Meteor.userId()
			if settings.language?
				RocketChat.models.Users.setLanguage Meteor.userId(), settings.language

			# if settings.password?
			# 	Accounts.setPassword Meteor.userId(), settings.password, { logout: false }

			if settings.realname?
				Meteor.call 'setRealName', settings.realname

			if settings.username?
				Meteor.call 'setUsername', settings.username

			if settings.email?
				Meteor.call 'setEmail', settings.email

			profile = {}

			RocketChat.models.Users.setProfile Meteor.userId(), profile

			return true
