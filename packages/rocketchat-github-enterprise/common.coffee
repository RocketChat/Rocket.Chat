config =
	serverURL: ''
	identityPath: '/api/v3/user'
	authorizePath: '/login/oauth/authorize'
	tokenPath: '/login/oauth/access_token'
	addAutopublishFields:
		forLoggedInUser: ['services.github-enterprise']
		forOtherUsers: ['services.github-enterprise.username']

GitHubEnterprise = new CustomOAuth 'github_enterprise', config

if Meteor.isServer
	Meteor.startup ->
		RocketChat.models.Settings.find({ _id: 'API_GitHub_Enterprise_URL' }).observe
			added: (record) ->
				config.serverURL = RocketChat.settings.get 'API_GitHub_Enterprise_URL'
				GitHubEnterprise.configure config
			changed: (record) ->
				config.serverURL = RocketChat.settings.get 'API_GitHub_Enterprise_URL'
				GitHubEnterprise.configure config
else
	Meteor.startup ->
		Tracker.autorun ->
			if RocketChat.settings.get 'API_GitHub_Enterprise_URL'
				config.serverURL = RocketChat.settings.get 'API_GitHub_Enterprise_URL'
				GitHubEnterprise.configure config
