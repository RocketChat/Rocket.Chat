Meteor.methods
	getRoomIdByNameOrId: (rid) ->

		check rid, String

		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'getRoomIdByNameOrId' }

		room = RocketChat.cache.Rooms.findOneById(rid) or RocketChat.cache.Rooms.findOneByName(rid)

		if not room?
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'getRoomIdByNameOrId' }

		if room.usernames.indexOf(Meteor.user()?.username) isnt -1
			return room._id

		if room.t isnt 'c' or RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'getRoomIdByNameOrId' }

		return room._id
