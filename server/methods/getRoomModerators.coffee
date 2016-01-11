Meteor.methods
	getRoomModerators: (rid) ->
		unless Meteor.userId()
			throw new Meteor.Error(403, "[methods] getRoomModerators -> Invalid user")

		query =
			rid: rid
			roles: 'moderator'

		options =
			sort:
				"u.username": 1
			fields:
				u: 1

		return _.map(RocketChat.models.Subscriptions.find(query, options).fetch(), (subscription) -> return subscription.u)
