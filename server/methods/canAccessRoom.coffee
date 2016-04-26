Meteor.methods
	canAccessRoom: (rid, userId) ->
		user = RocketChat.models.Users.findOneById userId, fields: username: 1

		unless user?.username
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'canAccessRoom' }

		unless rid
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'canAccessRoom' }

		room = RocketChat.models.Rooms.findOneById rid, { fields: { usernames: 1, t: 1, name: 1, muted: 1, sms: 1, v: 1 } }

		if room
			if RocketChat.authz.canAccessRoom.call(this, room, user)
				return _.pick room, ['_id', 't', 'name', 'usernames', 'muted', 'sms', 'v']
			else
				return false
		else
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'canAccessRoom' }
