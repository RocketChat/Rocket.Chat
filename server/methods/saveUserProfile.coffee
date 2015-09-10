Meteor.methods
	saveUserProfile: (settings) ->
		if Meteor.userId()
			if settings.language?
				Meteor.users.update Meteor.userId(), { $set: { language: settings.language } }

			if settings.password?
				Accounts.setPassword Meteor.userId(), settings.password, { logout: false }

			if settings.username?
				Meteor.call 'setUsername', settings.username

			profile = {}

			Meteor.users.update Meteor.userId(), { $set: { "settings.profile": profile } }

			return true
