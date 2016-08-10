Meteor.methods
	canAccessRoom: (rid, userId) ->
		user = RocketChat.cache.Users.findOneById userId, fields: username: 1

		console.log 'canAccessRoom.user ->', user

		unless user?.username
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'canAccessRoom' }

		console.log 'canAccessRoom.rid ->', rid

		unless rid
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'canAccessRoom' }

		room = RocketChat.cache.Rooms.findOneById rid

		console.log 'canAccessRoom.room ->', room

		if room
			if RocketChat.authz.canAccessRoom.call(this, room, user)
				room.username = user.username
				console.log 'has permission ->', room
				return room
			else
				console.log 'DONT HAS PERMISSION'
				return false
		else
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'canAccessRoom' }
