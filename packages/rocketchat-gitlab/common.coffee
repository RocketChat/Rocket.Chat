Gitlab = new CustomOAuth 'gitlab',
	serverURL: 'https://gitlab.com'
	identityPath: '/api/v3/user'
	addAutopublishFields:
		forLoggedInUser: ['services.gitlab']
		forOtherUsers: ['services.gitlab.username']

Meteor.startup ->
	Tracker.autorun ->
		if RocketChat.settings.get 'API_Gitlab_URL'
			Gitlab.serverURL = RocketChat.settings.get 'API_Gitlab_URL'
