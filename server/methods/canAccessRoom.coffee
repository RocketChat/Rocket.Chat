Meteor.methods
	canAccessRoom: (rid, userId) ->
		console.log '[methods] canAccessRoom -> '.green, 'userId:', userId, 'rid:', rid

		user = RocketChat.models.Users.findOneById userId, fields: username: 1

		unless user?.username
			throw new Meteor.Error 'not-logged-user', "[methods] canAccessRoom -> User doesn't have enough permissions"

		unless rid
			throw new Meteor.Error 'invalid-room', '[methods] canAccessRoom -> Cannot access empty room'

		room = RocketChat.models.Rooms.findOneById rid, { fields: { usernames: 1, t: 1, name: 1 } }

		if room
			if room.t is 'c'
				canAccess = true
			else if room.usernames.indexOf(user.username) isnt -1
				canAccess = true

			if canAccess isnt true
				return false
			else
				return _.pick room, ['_id', 't', 'name', 'usernames']
		else
			throw new Meteor.Error 'invalid-room', '[methods] canAccessRoom -> Room ID is invalid'
