Meteor.methods
	getPersonalRegistry: () ->
		ng = new NGApi(RocketChat.settings.get('OrchestraIntegration_Server'))
		domain = RocketChat.settings.get('OrchestraIntegration_Domain')
		user = RocketChat.models.Users.findOneById Meteor.userId()
		username = user.username + "@" + domain
		try
			res = ng.trustedLogin username
			token = res.token
		catch e
			# unauthorized or error contacting server
			return

		try
			results = ng.getPersonalRegistry(token)
		catch e
			return

		if results then calls: results.data else calls: []
