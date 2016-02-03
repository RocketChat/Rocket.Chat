Meteor.methods
	getStatistics: (refresh) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] getStatistics -> Invalid user")

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics') is true
			throw new Meteor.Error 'not-authorized', '[methods] getStatistics -> Not authorized'

		if refresh
			return RocketChat.statistics.save()
		else
			return RocketChat.models.Statistics.findLast()

