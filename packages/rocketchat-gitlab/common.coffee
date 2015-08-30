Gitlab = new CustomOAuth 'gitlab',
	serverURL: 'https://gitlab.com'
	tokenURL: '/oauth/token'
	addAutopublishFields:
		forLoggedInUser: ['services.gitlab']
		forOtherUsers: ['services.gitlab.username']

Meteor.startup ->
	Tracker.autorun ->
		if RocketChat.settings.get 'API_Gitlab_URL'
			Gitlab.serverURL = RocketChat.settings.get 'API_Gitlab_URL'
