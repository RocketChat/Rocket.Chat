Meteor.methods
	getRoomModerators: (rid) ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] getRoomModerators -> Invalid user'

		check rid, String

		options =
			sort:
				"u.username": 1
			fields:
				rid: 1
				u: 1

		return RocketChat.models.Subscriptions.findByRoomIdAndRoles(rid, 'moderator', options).fetch()
