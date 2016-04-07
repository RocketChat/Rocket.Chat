Meteor.methods
	getRoomRoles: (rid) ->
		unless Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'getRoomRoles' }

		check rid, String

		options =
			sort:
				"u.username": 1
			fields:
				rid: 1
				u: 1
				roles: 1

		roles = RocketChat.models.Roles.find({ description: { $exists: 1 } }).fetch()
		return RocketChat.models.Subscriptions.findByRoomIdAndRoles(rid, _.pluck(roles, '_id'), options).fetch()
