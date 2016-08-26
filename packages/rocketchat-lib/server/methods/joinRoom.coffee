Meteor.methods
	joinRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'joinRoom' }

		room = RocketChat.models.Rooms.findOneById rid

		if not room?
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'joinRoom' }

		if room.t isnt 'c' or RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'joinRoom' }

		RocketChat.addUserToRoom(rid, Meteor.user())
