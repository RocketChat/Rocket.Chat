Meteor.methods
	joinRoom: (rid, code) ->

		check rid, String
		# check code, Match.Maybe(String)

		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'joinRoom' }

		room = RocketChat.models.Rooms.findOneById rid

		if not room?
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'joinRoom' }

		if room.t isnt 'c' or RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'joinRoom' }

		if room.joinCodeRequired is true and code isnt room.joinCode
			throw new Meteor.Error 'error-code-invalid', 'Invalid Code', { method: 'joinRoom' }

		RocketChat.addUserToRoom(rid, Meteor.user())
