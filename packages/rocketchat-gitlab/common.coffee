config =
	serverURL: 'https://gitlab.com'
	identityPath: '/api/v3/user'
	scope: 'api'
	addAutopublishFields:
		forLoggedInUser: ['services.gitlab']
		forOtherUsers: ['services.gitlab.username']

Gitlab = new CustomOAuth 'gitlab', config

if Meteor.isServer
	Meteor.startup ->
		RocketChat.settings.get 'API_Gitlab_URL', (key, value) ->
			config.serverURL = value
			Gitlab.configure config
else
	Meteor.startup ->
		Tracker.autorun ->
			if RocketChat.settings.get 'API_Gitlab_URL'
				config.serverURL = RocketChat.settings.get 'API_Gitlab_URL'
				Gitlab.configure config
