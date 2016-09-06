Meteor.methods
	getStatistics: (refresh) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'getStatistics' })

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics') is true
			throw new Meteor.Error('error-not-allowed', "Not allowed", { method: 'getStatistics' })

		if refresh
			return RocketChat.statistics.save()
		else
			return RocketChat.models.Statistics.findLast()

