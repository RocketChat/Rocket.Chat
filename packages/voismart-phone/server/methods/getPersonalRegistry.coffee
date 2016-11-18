Meteor.methods
	getPersonalRegistry: () ->
		domain = RocketChat.settings.get('OrchestraIntegration_Domain')
		user = RocketChat.models.Users.findOneById Meteor.userId()
		username = user.username + "@" + domain
		ng = new NGApiAuto(username, RocketChat.settings.get('OrchestraIntegration_Server'))
		try
			results = ng.getPersonalRegistry()
		catch e
			return

		if results then calls: results.data else calls: []
