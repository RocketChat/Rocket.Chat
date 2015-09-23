config =
	serverURL: 'https://gitlab.com'
	identityPath: '/api/v3/user'
	addAutopublishFields:
		forLoggedInUser: ['services.gitlab']
		forOtherUsers: ['services.gitlab.username']

Gitlab = new CustomOAuth 'gitlab', config

Meteor.startup ->
	Tracker.autorun ->
		if RocketChat.settings.get 'API_Gitlab_URL'
			config.serverURL = RocketChat.settings.get 'API_Gitlab_URL'
			Gitlab.configure config
