Meteor.methods
	canAccessRoom: (rid, userId) ->
		user = RocketChat.models.Users.findOneById userId, fields: username: 1

		unless user?.username
			throw new Meteor.Error 'not-logged-user', "[methods] canAccessRoom -> User doesn't have enough permissions"

		unless rid
			throw new Meteor.Error 'invalid-room', '[methods] canAccessRoom -> Cannot access empty room'

		room = RocketChat.models.Rooms.findOneById rid, { fields: { usernames: 1, t: 1, name: 1, muted: 1, sms: 1, v: 1 } }

		if room
			if RocketChat.authz.canAccessRoom.call(this, room, user)
				return _.pick room, ['_id', 't', 'name', 'usernames', 'muted', 'sms', 'v']
			else
				return false
		else
			throw new Meteor.Error 'invalid-room', '[methods] canAccessRoom -> Room ID is invalid'
