config =
	serverURL: ''
	identityPath: '/oauth/me'
	addAutopublishFields:
		forLoggedInUser: ['services.wordpress']
		forOtherUsers: ['services.wordpress.user_login']

WordPress = new CustomOAuth 'wordpress', config

Meteor.startup ->
	Tracker.autorun ->
		if RocketChat.settings.get 'API_Wordpress_URL'
			config.serverURL = RocketChat.settings.get 'API_Wordpress_URL'
			WordPress.configure config
