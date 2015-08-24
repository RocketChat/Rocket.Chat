Meteor.startup ->
	Tracker.autorun ->
		if RocketChat.settings.get 'API_Gitlab_URL'
			Gitlab.ServerURL = RocketChat.settings.get 'API_Gitlab_URL'
