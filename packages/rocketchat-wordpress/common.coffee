config =
	serverURL: ''
	identityPath: '/oauth/me'
	addAutopublishFields:
		forLoggedInUser: ['services.wordpress']
		forOtherUsers: ['services.wordpress.user_login']

WordPress = new CustomOAuth 'wordpress', config

if Meteor.isServer
	Meteor.startup ->
		RocketChat.settings.get 'API_Wordpress_URL', (key, value) ->
			config.serverURL = value
			WordPress.configure config
else
	Meteor.startup ->
		Tracker.autorun ->
			if RocketChat.settings.get 'API_Wordpress_URL'
				config.serverURL = RocketChat.settings.get 'API_Wordpress_URL'
				WordPress.configure config
